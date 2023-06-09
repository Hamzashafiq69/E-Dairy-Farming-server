const express = require('express')
const router = express.Router();
const {Product} = require('../models/product')
const {Category} = require('../models/category')
const mongoose =  require('mongoose')
const multer = require('multer')

const FILE_TYPE_MAP = {
  'image/png' : 'png',
  'image/jpeg' : 'jpeg',
  'image/jpg' : 'jpg',
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('Invalid Image Type');
    if(isValid){
      uploadError = null
    }
    cb(uploadError, 'public/uploads')
  },


  filename: function (req, file, cb) {
    
    const filename = file.originalname.split(' ').join('-');
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${filename}-${Date.now()}.${extension}`)
  }
})

const uploadOptions = multer({ storage: storage })

router.get(`/`,async (req, res)=>{
let filter = {}
  if(req.query.categories){
    filter = {category : req.query.categories.split(',')}
  }

    const productList = await Product.find( filter).populate('category');
    // .select('name image images -_id description price category countInStock rating');

    if (!productList){
      res.status(500).json({
        success: false
      })
    }
    res.send(productList)
})

router.get(`/:id`,async (req, res)=>{

    const product = await Product.findById(req.params.id)
    // .populate('category');
    if (!product){
      res.status(500).json({
        success: false
      })
    }
    res.send(product)
})

router.post(`/`,uploadOptions.single('image'), async(req, res)=>{
  const category = await Category.findById(req.body.category)
  if(!category){
    res.status(400).send('Invalid category')
}
  const file = req.file; 
  if(!file){
    res.status(400).send('No image in the request')
}
  const filename = req.file.filename;
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
   let product = new Product({
name : req.body.name,
description : req.body.description,
richDescription : req.body.richDescription,
image : `${basePath}${filename}`,
brand : req.body.brand,
price : req.body.price,
category : req.body.category,
countInStock : req.body.countInStock,
rating : req.body.rating,
numReviews : req.body.numReviews,
isFeatured : req.body.isFeatured,

   });
   try {
     product= await product.save();
    // console.log('Product saved successfully:');
  } catch (error) {
    console.error('Error saving product:', error);
  }
// product= await product.save();
if(!product){
  res.status(500).send('The product cannot be created')
}else{
  res.send(product);
}
 
})

router.put('/:id',async(req,res)=>{
if(!mongoose.isValidObjectId(req.params.id)){
  res.status(400).send('Invalid Product Id')
}
  const category = await Category.findById(req.body.category)
  if(!category){
    res.status(400).send('Invalid category')
}

  const product = await Product.findByIdAndUpdate(req.params.id,{
    name : req.body.name,
    description : req.body.description,
    richDescription : req.body.richDescription,
    image : req.body.image,
    brand : req.body.brand,
    price : req.body.price,
    category : req.body.category,
    countInStock : req.body.countInStock,
    rating : req.body.rating,
    numReviews : req.body.numReviews,
    isFeatured : req.body.isFeatured,
  },{new:true})
  if(!product){
      res.status(500).send('The product cannot be created')
  }else{
      res.send(product);
  }
  })


  router.delete('/:id',(req,res)=>{
    Product.findByIdAndRemove(req.params.id).then(product=>{
        if(product){
            return res.status(200).json({
                success: true,
                message: "the product is deleted"
            })
        }else{
            return res.status(404).json({
                success:false,
                message: 'product not found'
            }).catch(err=>{
                return res.status(400).json({
                    success:false,
                    error: err 
                })
            })
        }
    })
})

router.get('/get/count',async (req, res)=>{

  const productCount = await Product.countDocuments()
  
  if (!productCount){
    res.status(500).json({
      success: false
    })
  }
  res.send({
    productCount: productCount
})
})


router.get('/get/featured/:count',async (req, res)=>{
const count = req.params.count ? req.params.count : 0
  const products = await Product.find({isFeatured: true}).limit(+count)
  
  if (!products){
    res.status(500).json({
      success: false
    })
  }
  res.send(products)
})

router.put('/gallery-images/:id',
uploadOptions.array('images', 10),
async (req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id)){
    res.status(400).send('Invalid Product Id')
  }
const files = req.files
const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

let imagesPaths = []

if(files){
files.map(file=>{
  imagesPaths.push(`${basePath}${file.filename}`)
})
}
  const product = await Product.findByIdAndUpdate(req.params.id,{
   images : imagesPaths
  },
  {new:true}
  )
  if(!product){
    res.status(500).send('The product cannot be created')
}else{
    res.send(product);
}

})


module.exports = router;
