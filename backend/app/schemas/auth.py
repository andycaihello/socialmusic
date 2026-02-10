"""Authentication schemas for validation and serialization"""
from marshmallow import Schema, fields, validate, validates, ValidationError
import re


class RegisterSchema(Schema):
    """Schema for user registration"""
    username = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=80),
        error_messages={'required': 'Username is required'}
    )
    email = fields.Email(
        required=True,
        error_messages={'required': 'Email is required', 'invalid': 'Invalid email format'}
    )
    phone = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(min=10, max=20)
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=6, max=100),
        error_messages={'required': 'Password is required'}
    )
    nickname = fields.Str(required=False, allow_none=True, validate=validate.Length(max=100))

    @validates('phone')
    def validate_phone(self, value):
        """Validate phone number format"""
        if value:
            # Basic phone number validation (digits, spaces, dashes, parentheses, plus)
            pattern = r'^[\d\s\-\(\)\+]+$'
            if not re.match(pattern, value):
                raise ValidationError('Invalid phone number format')


class LoginSchema(Schema):
    """Schema for user login"""
    identifier = fields.Str(
        required=True,
        error_messages={'required': 'Email or username is required'}
    )
    password = fields.Str(
        required=True,
        error_messages={'required': 'Password is required'}
    )


class ChangePasswordSchema(Schema):
    """Schema for changing password"""
    old_password = fields.Str(required=True)
    new_password = fields.Str(
        required=True,
        validate=validate.Length(min=6, max=100)
    )


class UpdateProfileSchema(Schema):
    """Schema for updating user profile"""
    nickname = fields.Str(required=False, allow_none=True, validate=validate.Length(max=100))
    bio = fields.Str(required=False, allow_none=True, validate=validate.Length(max=500))
    phone = fields.Str(required=False, allow_none=True, validate=validate.Length(min=10, max=20))

    @validates('phone')
    def validate_phone(self, value):
        """Validate phone number format"""
        if value:
            pattern = r'^[\d\s\-\(\)\+]+$'
            if not re.match(pattern, value):
                raise ValidationError('Invalid phone number format')
