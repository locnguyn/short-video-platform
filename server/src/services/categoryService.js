import models from "../models/index.js"


const getCategories = async () => {
    return await models.Category.find();
}


export default {
    getCategories
}
