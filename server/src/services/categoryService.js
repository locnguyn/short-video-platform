import models from "../models/index.js"


const getCategories = async () => {
    return models.Category.find();
}

const getCategory = async (categoryId) => {
    return models.Category.findById(categoryId);
}

export default {
    getCategories,
    getCategory
}
