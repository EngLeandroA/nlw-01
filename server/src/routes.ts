import express from 'express';
import { celebrate, Joi } from 'celebrate';

import multer from 'multer';
import multerConfig from './config/multer'

import PointsController from './controllers/PointsController';
import ItemsController from './controllers/ItemsController';

// Index, Show, Create, Update, Delete
const routes = express.Router()
const upload = multer(multerConfig);

const pointsController = new PointsController();
const itensController = new ItemsController();

routes.get('/items', itensController.index)

routes.get('/points', pointsController.index);
routes.get('/points/:id', pointsController.show);

routes.post(
    '/points', 
    upload.single('image'),
    celebrate({
        body: Joi.object().keys({
            name: Joi.string().required(),
            email: Joi.string().required().email(),
            whatsapp: Joi.number().required(),
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
            city: Joi.string().required(),
            uf: Joi.string().required().max(2),
            items: Joi.string().required(), // implemante rejex para verificar numero e virgula
        })
    }, {
        abortEarly: false
    }), 
    pointsController.create
    );

export default routes;