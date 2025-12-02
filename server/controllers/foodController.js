const Food = require('../models/foodModel');
const { cloudinary } = require('../utils/cloudinary');

// Get all food items
exports.getAllFood = async (req, res) => {
  try {
    const foods = await Food.find();
    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single food item
exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.status(200).json(food);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new food item
exports.createFood = async (req, res) => {
  try {
    console.log('Received food creation request:', {
      body: req.body,
      file: req.file,
      headers: req.headers['content-type']
    });

    let imageData = null;
    
    // Handle file upload
    if (req.file) {
      console.log('Processing uploaded file:', req.file);
      imageData = {
        url: req.file.path || req.file.secure_url || req.file.url,
        public_id: req.file.filename || req.file.public_id
      };
    }
    // Handle base64 image
    else if (req.body.image && req.body.image.startsWith('data:image')) {
      console.log('Processing base64 image');
      try {
        // Upload base64 image to Cloudinary
        const result = await cloudinary.uploader.upload(req.body.image, {
          folder: 'quick-tap',
          resource_type: 'auto'
        });
        
        console.log('Cloudinary upload result:', result);
        
        imageData = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (uploadError) {
        console.error('Error uploading base64 image:', uploadError);
        return res.status(400).json({
          message: 'Failed to upload image to Cloudinary',
          error: uploadError.message
        });
      }
    }
    // Handle URL image
    else if (req.body.image && req.body.image.startsWith('http')) {
      imageData = {
        url: req.body.image,
        public_id: null
      };
    } else {
      console.log('No image data found in request');
      return res.status(400).json({ message: 'Image is required' });
    }

    // Remove image from body if it exists to avoid duplicate data
    const { image, ...foodBody } = req.body;

    const foodData = {
      ...foodBody,
      image: imageData.url, // Store just the URL for backward compatibility
      imageData: imageData, // Store full image data for future use
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Creating food with data:', foodData);
    
    const food = new Food(foodData);
    const savedFood = await food.save();
    
    console.log('Food saved successfully:', savedFood);
    
    res.status(201).json(savedFood);
  } catch (error) {
    console.error('Error creating food:', error);
    res.status(400).json({ 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update a food item
exports.updateFood = async (req, res) => {
  try {
    console.log('Received food update request:', {
      body: req.body,
      file: req.file,
      id: req.params.id
    });

    let imageData = null;
    
    // Handle file upload
    if (req.file) {
      console.log('Processing uploaded file:', req.file);
      imageData = {
        url: req.file.path || req.file.secure_url || req.file.url,
        public_id: req.file.filename || req.file.public_id
      };
    }
    // Handle base64 image
    else if (req.body.image && req.body.image.startsWith('data:image')) {
      console.log('Processing base64 image');
      try {
        // Upload base64 image to Cloudinary
        const result = await cloudinary.uploader.upload(req.body.image, {
          folder: 'quick-tap',
          resource_type: 'auto'
        });
        
        console.log('Cloudinary upload result:', result);
        
        imageData = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (uploadError) {
        console.error('Error uploading base64 image:', uploadError);
        return res.status(400).json({
          message: 'Failed to upload image to Cloudinary',
          error: uploadError.message
        });
      }
    }
    // Handle URL image
    else if (req.body.image && req.body.image.startsWith('http')) {
      imageData = {
        url: req.body.image,
        public_id: null
      };
    }

    // Remove image from body if it exists to avoid duplicate data
    const { image, ...foodBody } = req.body;

    const updateData = {
      ...foodBody,
      updatedAt: new Date()
    };

    // Add image data if available
    if (imageData) {
      updateData.image = imageData.url;
      updateData.imageData = imageData;
    } else {
      // If no new image, retain the existing one
      const existingFood = await Food.findById(req.params.id);
      if (existingFood) {
        updateData.image = existingFood.image;
        updateData.imageData = existingFood.imageData;
      }
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!food) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    res.status(200).json(food);
  } catch (error) {
    console.error('Error updating food:', error);
    res.status(400).json({ 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete a food item
exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    // Delete image from Cloudinary if exists
    if (food.imageData && food.imageData.public_id) {
      await cloudinary.uploader.destroy(food.imageData.public_id);
    }

    await Food.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting food:', error);
    res.status(500).json({ message: error.message });
  }
};

// Toggle food availability
exports.toggleAvailability = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    food.isAvailable = !food.isAvailable;
    food.updatedAt = new Date();
    const updatedFood = await food.save();
    res.status(200).json(updatedFood);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 