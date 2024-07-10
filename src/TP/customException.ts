import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomException extends HttpException {
  constructor(message: string, statusCode: HttpStatus) {
    super(message, statusCode);
  }
}

// Specific custom exceptions
export class BadRequestException extends CustomException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class NotFoundException extends CustomException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedException extends CustomException {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends CustomException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN);
  }
}

// Add more specific exceptions as needed
