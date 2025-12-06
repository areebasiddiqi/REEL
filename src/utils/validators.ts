// Email validation
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password validation (min 6 characters)
export const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
};

// Display name validation
export const isValidDisplayName = (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 50;
};

// Video file validation
export const isValidVideoFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload MP4, WebM, OGG, or MOV files.',
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size exceeds 500MB limit.',
        };
    }

    return { valid: true };
};

// Image file validation
export const isValidImageFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP files.',
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size exceeds 10MB limit.',
        };
    }

    return { valid: true };
};

// URL validation
export const isValidURL = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};
