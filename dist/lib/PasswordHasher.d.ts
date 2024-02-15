declare class PasswordHasher {
    static generateSalt(size?: number): Promise<string>;
    static hash(password: string, salt: string): Promise<string>;
}
export default PasswordHasher;
