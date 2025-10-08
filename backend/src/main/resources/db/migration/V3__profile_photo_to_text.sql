-- Change profile_photo column from varchar(255) to TEXT to allow storing base64 images
ALTER TABLE users
    ALTER COLUMN profile_photo TYPE TEXT;