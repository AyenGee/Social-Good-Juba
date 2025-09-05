const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

// GET /api/profile - Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching profile for user ID:', userId);

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      return res.status(400).json({ error: userError.message });
    }

    console.log('User data fetched:', userData ? 'Success' : 'Failed');

    let responseData = { user: userData };

    // If user is a freelancer, get freelancer profile
    if (userData.role === 'freelancer') {
      console.log('User is freelancer, fetching freelancer profile...');
      const { data: freelancerData, error: freelancerError } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (freelancerError && freelancerError.code !== 'PGRST116') {
        console.error('Freelancer profile fetch error:', freelancerError);
        return res.status(400).json({ error: freelancerError.message });
      }

      console.log('Freelancer profile fetched:', freelancerData ? 'Success' : 'No profile found');
      responseData.freelancer_profile = freelancerData;
    }

    console.log('Profile fetch successful');
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile - Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Updating profile for user ID:', userId);
    console.log('Request body:', req.body);
    
    const {
      first_name,
      last_name,
      phone,
      address,
      date_of_birth,
      gender,
      education_level,
      employment_status,
      profile_picture_url,
      bio,
      experience_years,
      hourly_rate_min,
      hourly_rate_max,
      service_areas,
      languages_spoken,
      transportation_available,
      insurance_coverage
    } = req.body;

    // Update user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        first_name,
        last_name,
        phone,
        address,
        date_of_birth,
        gender,
        education_level,
        employment_status,
        profile_picture_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      console.error('User update error:', userError);
      return res.status(400).json({ error: userError.message });
    }

    let responseData = { user: userData };

    // Update freelancer profile if user is freelancer
    if (userData.role === 'freelancer') {
      // Check if freelancer profile exists
      const { data: existingProfile } = await supabase
        .from('freelancer_profiles')
        .select('id, documents')
        .eq('user_id', userId)
        .single();

      const freelancerData = {
        user_id: userId,
        bio: bio || null,
        experience_years: experience_years ? parseInt(experience_years) : null,
        hourly_rate_min: hourly_rate_min ? parseFloat(hourly_rate_min) : null,
        hourly_rate_max: hourly_rate_max ? parseFloat(hourly_rate_max) : null,
        service_areas: Array.isArray(service_areas) ? service_areas : [],
        languages_spoken: Array.isArray(languages_spoken) ? languages_spoken : [],
        transportation_available: transportation_available || false,
        insurance_coverage: insurance_coverage || false,
        updated_at: new Date().toISOString()
      };

      // Keep existing documents if they exist
      if (existingProfile?.documents) {
        freelancerData.documents = existingProfile.documents;
      }

      let freelancerResult;
      if (existingProfile) {
        // Update existing profile
        freelancerResult = await supabase
          .from('freelancer_profiles')
          .update(freelancerData)
          .eq('user_id', userId)
          .select()
          .single();
      } else {
        // Create new profile
        freelancerResult = await supabase
          .from('freelancer_profiles')
          .insert([freelancerData])
          .select()
          .single();
      }

      if (freelancerResult.error) {
        console.error('Freelancer profile update error:', freelancerResult.error);
        return res.status(400).json({ error: freelancerResult.error.message });
      }

      responseData.freelancer_profile = freelancerResult.data;
    }

    res.json({
      message: 'Profile updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/upload-document - Upload documents
router.post('/upload-document', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { document_type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!document_type || !['cv', 'police_clearance'].includes(document_type)) {
      return res.status(400).json({ error: 'Invalid document type. Must be "cv" or "police_clearance"' });
    }

    // Generate file path
    const fileExt = path.extname(file.originalname);
    const fileName = `${document_type}${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log(`Uploading file: ${filePath}, Size: ${file.size}, Type: ${file.mimetype}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(400).json({ error: uploadError.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-documents')
      .getPublicUrl(filePath);

    // Get or create freelancer profile with document info
    const { data: freelancerProfile, error: fetchError } = await supabase
      .from('freelancer_profiles')
      .select('documents')
      .eq('user_id', userId)
      .single();

    let documents = {};
    if (freelancerProfile?.documents && typeof freelancerProfile.documents === 'object') {
      documents = { ...freelancerProfile.documents };
    }

    documents[document_type] = {
      url: urlData.publicUrl,
      uploaded_at: new Date().toISOString(),
      file_name: file.originalname,
      file_size: file.size
    };

    // Update or create freelancer profile with document
    const { data: updateData, error: updateError } = await supabase
      .from('freelancer_profiles')
      .upsert({
        user_id: userId,
        documents,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (updateError) {
      console.error('Document update error:', updateError);
      return res.status(400).json({ error: updateError.message });
    }

    res.json({
      message: 'Document uploaded successfully',
      document: {
        type: document_type,
        url: urlData.publicUrl,
        uploaded_at: documents[document_type].uploaded_at,
        file_name: file.originalname,
        file_size: file.size
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/profile/delete-document/:document_type - Delete document
router.delete('/delete-document/:document_type', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { document_type } = req.params;

    if (!['cv', 'police_clearance'].includes(document_type)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Get current documents
    const { data: freelancerProfile } = await supabase
      .from('freelancer_profiles')
      .select('documents')
      .eq('user_id', userId)
      .single();

    if (!freelancerProfile?.documents?.[document_type]) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from storage - try different file extensions
    const extensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    for (const ext of extensions) {
      const filePath = `${userId}/${document_type}${ext}`;
      await supabase.storage
        .from('user-documents')
        .remove([filePath]);
    }

    // Update database
    const documents = { ...freelancerProfile.documents };
    delete documents[document_type];

    const { error: updateError } = await supabase
      .from('freelancer_profiles')
      .update({
        documents,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Document deletion update error:', updateError);
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;