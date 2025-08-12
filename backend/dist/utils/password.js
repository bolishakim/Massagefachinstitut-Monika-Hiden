import bcrypt from 'bcryptjs';
export class PasswordUtils {
    static SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    static async hash(password) {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }
    static async compare(password, hash) {
        return bcrypt.compare(password, hash);
    }
    static validate(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (password.length > 128) {
            errors.push('Password must be less than 128 characters');
        }
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static generateResetToken() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
}
//# sourceMappingURL=password.js.map