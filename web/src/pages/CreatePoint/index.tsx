import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'
import api from '../../services/api';
import axios from 'axios';
import * as yup from 'yup';
import Dropzone from '../../components/Dropzone'

import './styles.css';


import logo from '../../assets/logo.svg';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUFResponse {
    sigla: string,
    nome: string,
}

interface IBGECityResponse {
    nome: string;
}

const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<IBGEUFResponse[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [initialPosition, setInitialPosition] = useState<[number,number]>([0, 0]);

    const [formData, setFormData] = useState({
        name: '',
        email:'',
        whatsapp: '',
    }) 

    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<[number,number]>([0, 0]);
    const [selectedFile, setSelectedFile] = useState<File>();
    
    const [conclusion, setConclusion] = useState<boolean>(true);

    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitialPosition([ latitude, longitude ]);
        })
    }, []);

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data)
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials =  [{} as IBGEUFResponse];

            ufInitials.splice(0, 1); // Remover o primeiro item vazio
            
              response.data.sort((a, b) => (a.nome > b.nome) ? 1 : -1).map(uf =>
                ufInitials.push(
                  {
                    sigla: uf.sigla, 
                    nome: uf.nome,
                  }
                ));

            setUfs(ufInitials);
        });
    }, []);

    useEffect(() => {
        if(selectedUf === '0'){
            return;
        }

        axios
            .get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
            .then(response => {
                const cityName = response.data.map(city => city.nome);

                setCities(cityName);
            });

    }, [selectedUf]);

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;

        setSelectedUf(uf);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;

        setSelectedCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ])
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const { name, value } = event.target;

        setFormData({ ...formData, [name]: value });
    }

    function handleSelectItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);

            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([ ...selectedItems, id ]);
        }
    }

    async function handleSubmit(event: FormEvent){
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [ latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = new FormData();

        
        data.append('name',name);
        data.append('email',email);
        data.append('whatsapp',whatsapp);
        data.append('uf',uf);
        data.append('city',city);
        data.append('latitude',String(latitude));
        data.append('longitude',String(longitude));
        data.append('items',items.join(','));
        
        if(selectedFile) {
            data.append('image', selectedFile)
        }
        
        const valLatitude = latitude === 0 ? null : latitude
        const valLongitude = longitude === 0 ? null : longitude
        
        const schema = yup.object().shape({
            name: yup.string().required('Favor inserir o nome do estabelecimento'),
            email: yup.string().required('Favor inserir o e-mail do estabelecimento').email('Favor inserir o e-mail correto'),
            whatsapp: yup.string().required('Favor inserir o Whatsapp do estabelecimento').typeError('Favor digitar apenas numeros no Whatsapp'),
            latitude: yup.number().required().typeError('Favor inserir o selecionar a latitude do estabelecimento'),
            longitude: yup.number().required().typeError('Favor inserir o selecionar a longitude do estabelecimento'),
            city: yup.string().required('Favor inserir a cidade do estabelecimento'),
            uf: yup.string().required('Favor inserir o UF do estabelecimento').max(2),
            items: yup.string().required('Favor inserir os itens do estabelecimento'),
        })

        schema.validate({
            name: name, 
            email: email,
            whatsapp: whatsapp,
            latitude: valLatitude,
            longitude: valLongitude,
            city: city,
            uf: uf,
            items: items
        }, {abortEarly: false})
        .then(function (valid) {
            
            setConclusion(true);

            savedata(data);
            
            setTimeout(() => {
                setConclusion(false);

                history.push('/');
              }, 2000);
             
        })
        .catch(function (erro) {
            alert(erro.errors);
            
        })    
    }

    async function savedata(data: FormData) {

        await api.post('points', data);

    }


  return (

      <div id="page-create-point">

          <div className={(conclusion) ? 'end-show' : 'end-hide'}>
            <h1><FiCheckCircle /></h1>
            <h2>Cadastro concluído!</h2>
          </div>
          
          <header>
              <img src={logo} alt="Ecoleta" />
              <Link to="/">
                  <FiArrowLeft />
                  Voltar para home
              </Link>
          </header>

          <form onSubmit={handleSubmit}>
              <h1>Cadastro do <br /> ponto de coleta</h1>

              <Dropzone onFileUploaded={setSelectedFile} />

              <fieldset>
                  <legend>
                      <h2>Dados</h2>
                  </legend>

                  <div className="field">
                      <label htmlFor="name">Noma da entidade</label>
                      <input 
                        type="text"
                        name= "name"
                        id= "name"
                        onChange={handleInputChange}
                      />
                  </div>

                  <div className="field-group">
                    <div className="field">
                        <label htmlFor="email">E-mail</label>
                        <input 
                            type="email"
                            name= "email"
                            id= "email"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="whatsapp">Whatsapp</label>
                        <input 
                            type="text"
                            name= "whatsapp"
                            id= "whatsapp"
                            onChange={handleInputChange}
                        />
                  </div>
                  </div>
              </fieldset>

              <fieldset>
                  <legend>
                      <h2>Endereço</h2>
                      <span>Selecione o endereço no mapa</span>
                  </legend>

                  <div className={(conclusion) ? 'map-hiden' : 'map'}>
                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition} />
                    </Map>
                  </div>

                  <div className="field-group">

                      <div className="field">
                          <label htmlFor="uf">Estado (UF)</label>
                          <select 
                            name="uf" 
                            id="uf" 
                            value={selectedUf} 
                            onChange={handleSelectUf}
                          >
                              <option value="0">Selecione uma UF</option>
                              {ufs.map(uf => (
                                  <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                              ))}
                          </select>
                      </div>

                      <div className="field">
                          <label htmlFor="city">Cidade</label>
                          <select 
                            name="city" 
                            id="city"
                            value={selectedCity}
                            onChange={handleSelectCity}
                          >
                              <option value="0">Selecione uma cidade</option>
                              {cities.map(city => (
                                  <option key={city} value={city}>{city}</option>
                              ))}
                          </select>
                      </div>

                  </div>

              </fieldset>

              <fieldset>
                  <legend>
                      <h2>Ítens de coleta</h2>
                      <span>Selecione um ou mais ítens abaixo</span>
                  </legend>

                  <ul className="items-grid">
                      {items.map(item => (
                        <li            
                            key={item.id} 
                            onClick={() => handleSelectItem(item.id)}
                            className={selectedItems.includes(item.id) ? 'selected' : ''}
                        >
                          <img src={item.image_url} alt={item.title}/>
                          <span>{item.title}</span>
                        </li>
                      ))}
                  </ul>
              </fieldset>
              <button type="submit">
                  Cadastrar ponto de coleta
              </button>
          </form>
          
      </div>
  )
}

export default CreatePoint;
