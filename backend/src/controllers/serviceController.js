import Service from '../models/Service.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Get all services with filters
export const getAllServices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice,
      availability,
      priceType,
    } = req.query;

    // Build filter object
    const filter = { isActive: true, status: 'active' };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (availability && availability !== 'all') {
      filter.availability = availability;
    }

    if (priceType && priceType !== 'all') {
      filter.priceType = priceType;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Search filter
    if (search && search.trim()) {
      filter.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Sorting
    const sortObj = {};
    sortObj[sortBy] = order === 'asc' ? 1 : -1;

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const services = await Service.find(filter)
      .populate('provider.userId', 'fullName companyName avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Ensure all services have proper image URLs
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const servicesWithImages = services.map(service => {
      const serviceObj = service.toObject();

      // Ensure images array and URLs are correct
      if (!serviceObj.images || serviceObj.images.length === 0) {
        serviceObj.images = [];
      } else {
        serviceObj.images = serviceObj.images.map(img => {
          if (!img.url) {
            return img;
          }

          // If URL doesn't have full backend URL, add it
          if (!img.url.startsWith('http')) {
            return {
              ...img,
              url: `${backendUrl}${img.url.startsWith('/') ? '' : '/'}${img.url}`
            };
          }

          return img;
        });
      }

      return serviceObj;
    });

    console.log('✅ [Services API] Returning', servicesWithImages.length, 'services with images:');
    servicesWithImages.slice(0, 1).forEach((s, idx) => {
      console.log(`   Service ${idx + 1}: ${s.serviceName}`);
      console.log(`   - Images: ${s.images.length}`);
      s.images.forEach((img, imgIdx) => {
        console.log(`     Image ${imgIdx + 1}: ${img.url ? '✅' : '❌'} ${img.url || 'NO URL'}`);
      });
    });

    const total = await Service.countDocuments(filter);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          services: servicesWithImages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Services fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get single service by ID
export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } }, // Increment views
      { new: true }
    ).populate('provider.userId', 'fullName companyName avatar email phone');

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    // Ensure image URLs are complete
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const serviceObj = service.toObject();

    if (!serviceObj.images) {
      serviceObj.images = [];
    } else {
      serviceObj.images = serviceObj.images.map(img => {
        if (!img.url) return img;

        if (!img.url.startsWith('http')) {
          return {
            ...img,
            url: `${backendUrl}${img.url.startsWith('/') ? '' : '/'}${img.url}`
          };
        }

        return img;
      });
    }

    console.log(`✅ [Service Details] ${serviceObj.serviceName}`);
    console.log(`   Images: ${serviceObj.images.length}`);
    serviceObj.images.forEach((img, idx) => {
      console.log(`   - Image ${idx + 1}: ${img.url}`);
    });

    res.status(200).json(
      new ApiResponse(200, serviceObj, 'Service fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Create new service
export const createService = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      serviceName,
      description,
      category,
      price,
      currency = 'INR',
      priceType = 'fixed',
      deliveryTime,
      revisions,
      features = [],
      tags = [],
      phone,
      email,
      preferredContact,
      city,
      state,
      country = 'India',
    } = req.body;

    // Validation
    if (!serviceName || !description || !category || price === undefined || !deliveryTime) {
      throw new ApiError(400, 'All required fields must be provided');
    }

    if (price < 0) {
      throw new ApiError(400, 'Price cannot be negative');
    }

    // Get provider info from user
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Handle uploaded images - support both formats (correct and numeric keys fallback)
    let images = [];
    let imageFiles = [];

    console.log('\n' + '='.repeat(70));
    console.log('🖼️  [SERVICE IMAGE UPLOAD DEBUG]');
    console.log('='.repeat(70));
    console.log('req.files exists:', !!req.files);
    console.log('req.files type:', typeof req.files);
    if (req.files) {
      console.log('req.files keys:', Object.keys(req.files));
      console.log('req.files.images exists:', !!req.files.images);
    }

    if (req.files && req.files.images) {
      // Format 1: Correct - files grouped in 'images' array
      console.log('✅ Using Format 1: req.files.images found');
      imageFiles = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      console.log('   Image count:', imageFiles.length);
    } else if (req.files && Object.keys(req.files).length > 0) {
      // Format 2: Fallback - files indexed as numeric keys '0', '1', '2'
      console.log('⚠️  Using Format 2: Numeric keys fallback');
      imageFiles = Object.keys(req.files)
        .filter(key => !isNaN(key))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => req.files[key]);
      console.log('   Collected image count:', imageFiles.length);
    } else {
      console.log('❌ No images found in req.files');
    }

    if (imageFiles && imageFiles.length > 0) {
      console.log('📝 Processing images...');
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      images = imageFiles.map((file, idx) => {
        console.log(`   ${idx + 1}. Filename: ${file.filename}, Size: ${file.size}`);
        return {
          url: `${backendUrl}/uploads/services/${file.filename}`,
          alt: serviceName,
        };
      });
      console.log('✅ Images array prepared:', images.length, 'images');
    }

    console.log('📊 Final images array to save:', images);
    console.log('='.repeat(70) + '\n');

    // Create service
    const service = await Service.create({
      serviceName: serviceName.trim(),
      description: description.trim(),
      category,
      price: Number(price),
      currency,
      priceType,
      deliveryTime: Number(deliveryTime),
      revisions: revisions ? Number(revisions) : null,
      features: features.filter((f) => f.trim()),
      tags: tags.filter((t) => t.trim()),
      images,
      provider: {
        userId,
        companyName: user.seller?.companyName || user.fullName,
        businessType: user.seller?.businessType,
        isVerified: user.seller?.isVerified || false,
      },
      contact: {
        phone,
        email: email || user.email,
        preferredContact,
      },
      location: {
        city,
        state,
        country,
      },
    });

    res.status(201).json(
      new ApiResponse(201, service, 'Service created successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Update service
export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    // Get service
    const service = await Service.findById(id);
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    // Check ownership
    if (service.provider.userId.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to update this service');
    }

    // Allowed fields to update
    const allowedUpdates = [
      'serviceName',
      'description',
      'category',
      'price',
      'currency',
      'priceType',
      'deliveryTime',
      'revisions',
      'features',
      'tags',
      'availability',
      'contact',
      'location',
      'portfolio',
    ];

    // Filter updates
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        service[key] = updates[key];
      }
    });

    // Handle new images - support both formats
    if (req.files) {
      let imageFiles = [];

      if (req.files.images) {
        // Format 1: Correct - files grouped in 'images' array
        imageFiles = Array.isArray(req.files.images)
          ? req.files.images
          : [req.files.images];
      } else if (Object.keys(req.files).length > 0) {
        // Format 2: Fallback - files indexed as numeric keys
        imageFiles = Object.keys(req.files)
          .filter(key => !isNaN(key))
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => req.files[key]);
      }

      if (imageFiles && imageFiles.length > 0) {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
        const newImages = imageFiles.map((file) => ({
          url: `${backendUrl}/uploads/services/${file.filename}`,
          alt: service.serviceName,
        }));

        service.images = newImages;
      }
    }

    const updatedService = await service.save();

    res.status(200).json(
      new ApiResponse(200, updatedService, 'Service updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Delete service
export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const service = await Service.findById(id);
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    // Check ownership
    if (service.provider.userId.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to delete this service');
    }

    await Service.findByIdAndDelete(id);

    res.status(200).json(
      new ApiResponse(200, null, 'Service deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Get provider's services
export const getProviderServices = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const services = await Service.find({
      'provider.userId': providerId,
      isActive: true,
    })
      .populate('provider.userId', 'fullName companyName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Ensure image URLs are complete
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const servicesWithImages = services.map(service => {
      const serviceObj = service.toObject();

      if (!serviceObj.images) {
        serviceObj.images = [];
      } else {
        serviceObj.images = serviceObj.images.map(img => {
          if (!img.url) return img;

          if (!img.url.startsWith('http')) {
            return {
              ...img,
              url: `${backendUrl}${img.url.startsWith('/') ? '' : '/'}${img.url}`
            };
          }

          return img;
        });
      }

      return serviceObj;
    });

    const total = await Service.countDocuments({
      'provider.userId': providerId,
      isActive: true,
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          services: servicesWithImages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Provider services fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get current user's services (dashboard)
export const getMyServices = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status, category } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = { 'provider.userId': userId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    const services = await Service.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Ensure image URLs are complete
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const servicesWithImages = services.map(service => {
      const serviceObj = service.toObject();

      if (!serviceObj.images) {
        serviceObj.images = [];
      } else {
        serviceObj.images = serviceObj.images.map(img => {
          if (!img.url) return img;

          if (!img.url.startsWith('http')) {
            return {
              ...img,
              url: `${backendUrl}${img.url.startsWith('/') ? '' : '/'}${img.url}`
            };
          }

          return img;
        });
      }

      return serviceObj;
    });

    const total = await Service.countDocuments(filter);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          services: servicesWithImages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
          },
          stats: {
            totalServices: total,
            activeServices: await Service.countDocuments({
              'provider.userId': userId,
              status: 'active',
            }),
            totalViews: servicesWithImages.reduce((sum, s) => sum + (s.views || 0), 0),
            totalInquiries: servicesWithImages.reduce((sum, s) => sum + (s.inquiries || 0), 0),
          },
        },
        'Your services fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Record service inquiry
export const recordInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndUpdate(
      id,
      { $inc: { inquiries: 1 } },
      { new: true }
    );

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    res.status(200).json(
      new ApiResponse(200, service, 'Inquiry recorded successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Get services by category
export const getServicesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const skip = (page - 1) * limit;

    const services = await Service.find({
      category,
      isActive: true,
      status: 'active',
    })
      .populate('provider.userId', 'fullName companyName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Ensure image URLs are complete
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const servicesWithImages = services.map(service => {
      const serviceObj = service.toObject();

      if (!serviceObj.images) {
        serviceObj.images = [];
      } else {
        serviceObj.images = serviceObj.images.map(img => {
          if (!img.url) return img;

          if (!img.url.startsWith('http')) {
            return {
              ...img,
              url: `${backendUrl}${img.url.startsWith('/') ? '' : '/'}${img.url}`
            };
          }

          return img;
        });
      }

      return serviceObj;
    });

    const total = await Service.countDocuments({
      category,
      isActive: true,
      status: 'active',
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          services: servicesWithImages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Services by category fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Search services
export const searchServices = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 12 } = req.query;

    if (!query || query.trim().length < 2) {
      throw new ApiError(400, 'Search query must be at least 2 characters');
    }

    const skip = (page - 1) * limit;

    const services = await Service.find({
      $or: [
        { serviceName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ],
      isActive: true,
      status: 'active',
    })
      .populate('provider.userId', 'fullName companyName avatar')
      .sort({ views: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Ensure image URLs are complete
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const servicesWithImages = services.map(service => {
      const serviceObj = service.toObject();

      if (!serviceObj.images) {
        serviceObj.images = [];
      } else {
        serviceObj.images = serviceObj.images.map(img => {
          if (!img.url) return img;

          if (!img.url.startsWith('http')) {
            return {
              ...img,
              url: `${backendUrl}${img.url.startsWith('/') ? '' : '/'}${img.url}`
            };
          }

          return img;
        });
      }

      return serviceObj;
    });

    const total = await Service.countDocuments({
      $or: [
        { serviceName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ],
      isActive: true,
      status: 'active',
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          services: servicesWithImages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Services search results fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};
