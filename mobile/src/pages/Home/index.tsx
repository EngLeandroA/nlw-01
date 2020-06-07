import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Feather as Icon } from '@expo/vector-icons';
import { View, ImageBackground, Text, Image, StyleSheet } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';

interface IBGEUFResponse {
  sigla: string,
  nome: string,
}

interface IBGECityResponse {
  id: number;
  nome: string;
}

interface ItemPicker {
  label: string, 
  value: string,
  key: string
}

const Home = () => {
  const placeholderUf = {
    label: 'Selecione um estado...',
    value: '0',
    key: '0'
  };

  const placeholderCity = {
    label: 'Selecione uma cidade...',
    value: '0',
    key: '0'
  };

  const [ufs, setUfs] = useState([placeholderUf]);
  const [cities, setCities] = useState([placeholderCity]);

  const [selectedUf, setSelectedUf] = useState('0');
  const [selectedCity, setSelectedCity] = useState('0');

  const navigation = useNavigation();

  useEffect(() => {
      axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
          
          const ufInitials  = [{} as ItemPicker];   

          response.data.sort((a, b) => (a.nome > b.nome) ? 1 : -1).map(uf =>
            ufInitials.push(
              {
                label: uf.nome, 
                value: uf.sigla,
                key: uf.sigla
              }
            ));

          ufInitials.splice(0, 1); // Remover o primeiro item vazio

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
              const cityInitials  = [{} as ItemPicker];      

              response.data.sort((a, b) => (a.nome > b.nome) ? 1 : -1).map(city =>
                cityInitials.push(
                  {
                    label: city.nome, 
                    value: city.nome,
                    key: String(city.id)
                  }
                ));

              cityInitials.splice(0, 1); // Remover o primeiro item vazio

              setCities(cityInitials);
              });

  }, [selectedUf]);

  function handleSelectUf(value: string){
      const uf = value;
  
      setSelectedUf(uf);
      setSelectedCity('0');
  }

  function handleSelectCity(value: string){
    const city = value;

    setSelectedCity(city);
}
  
  function handleNavigateToPoints() {
    navigation.navigate('Points', {
      selectedUf,
      selectedCity
    });
  }

  return (
    <ImageBackground 
        source={require('../../assets/home-background.png')} 
        style={styles.container}
        imageStyle={{width: 274, height: 368}}
    >
        <View style={styles.main}>
            <Image source={require('../../assets/logo.png')} />
            <Text style={styles.title}>Seu marketplace de coleta de resíduos</Text>
            <Text style={styles.description}>Ajudamos pessoas a encontrarem pontos de coleta de forma eficiente.</Text>
        </View>

        <View style={styles.footer}>
            <RNPickerSelect
                style={pickerSelectStyles}
                placeholder={{}}
                value={selectedUf}
                onValueChange={(value) => handleSelectUf(value)}
                items={ufs}
            />

            <RNPickerSelect
                style={pickerSelectStyles}
                placeholder={{}}
                value={selectedCity}
                onValueChange={(value) => handleSelectCity(value)}
                items={cities}
            />

            <RectButton style={styles.button} onPress={handleNavigateToPoints}>
                <View style={styles.buttonIcon}>
                    <Text>
                        <Icon name='arrow-right' color='#FFF' size={24} />
                    </Text>
                </View>
                <Text style={styles.buttonText}>Entrar</Text>
            </RectButton>
        </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 32,
      backgroundColor: '#f0f0f5'
    },
  
    main: {
      flex: 1,
      justifyContent: 'center',
    },
  
    title: {
      color: '#322153',
      fontSize: 32,
      fontFamily: 'Ubuntu_700Bold',
      maxWidth: 260,
      marginTop: 64,
    },
  
    description: {
      color: '#6C6C80',
      fontSize: 16,
      marginTop: 16,
      fontFamily: 'Roboto_400Regular',
      maxWidth: 260,
      lineHeight: 24,
    },
  
    footer: {},
  
    select: {},
  
    input: {
      height: 60,
      backgroundColor: '#FFF',
      borderRadius: 10,
      marginBottom: 8,
      paddingHorizontal: 24,
      fontSize: 16,
    },

    button: {
      backgroundColor: '#34CB79',
      height: 60,
      flexDirection: 'row',
      borderRadius: 10,
      overflow: 'hidden',
      alignItems: 'center',
      marginTop: 8,
    },
  
    buttonIcon: {
      height: 60,
      width: 60,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      justifyContent: 'center',
      alignItems: 'center'
    },
  
    buttonText: {
      flex: 1,
      justifyContent: 'center',
      textAlign: 'center',
      color: '#FFF',
      fontFamily: 'Roboto_500Medium',
      fontSize: 16,
    }
  });

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    marginBottom: 8,
    borderRadius: 10,
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    marginBottom: 8,
    borderRadius: 10,
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});
  

export default Home;