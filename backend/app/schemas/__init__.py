"""Pydantic schemas package."""

from app.schemas.m01_example_schema import (
    ExampleCreate,
    ExampleRead,
    ExampleUpdate,
)

__all__ = [
    "ExampleCreate",
    "ExampleRead",
    "ExampleUpdate",
]
