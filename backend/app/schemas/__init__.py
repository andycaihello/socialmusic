"""Schemas initialization"""
from app.schemas.auth import (
    RegisterSchema,
    LoginSchema,
    ChangePasswordSchema,
    UpdateProfileSchema
)

__all__ = [
    'RegisterSchema',
    'LoginSchema',
    'ChangePasswordSchema',
    'UpdateProfileSchema'
]
