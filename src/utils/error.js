class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Pass the message to the parent Error class
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Mark this as an expected error

        Error.captureStackTrace(this, this.constructor); // Create stack trace properly
    }
}

export default AppError;