"""Example Pydantic schemas demonstrating common patterns.

This module provides example schemas for CRUD operations using Pydantic v2.
Following module prefix convention: m01_ for example/base schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ExampleBase(BaseModel):
    """Base schema with common fields for Example entity."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Name of the example item",
        examples=["Example Item 1"],
    )
    description: str | None = Field(
        default=None,
        max_length=500,
        description="Optional description of the item",
        examples=["This is a sample description"],
    )
    is_active: bool = Field(
        default=True,
        description="Whether the item is active",
    )


class ExampleCreate(ExampleBase):
    """Schema for creating a new Example entity.

    Inherits all fields from ExampleBase.
    Used for POST requests to create new items.
    """

    pass


class ExampleUpdate(BaseModel):
    """Schema for updating an existing Example entity.

    All fields are optional to allow partial updates.
    Used for PATCH requests.
    """

    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Name of the example item",
    )
    description: str | None = Field(
        default=None,
        max_length=500,
        description="Optional description of the item",
    )
    is_active: bool | None = Field(
        default=None,
        description="Whether the item is active",
    )


class ExampleRead(ExampleBase):
    """Schema for reading/returning an Example entity.

    Includes all base fields plus server-generated fields.
    Used for GET responses.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        ...,
        description="Unique identifier of the item",
        examples=[1],
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when the item was created",
    )
    updated_at: datetime = Field(
        ...,
        description="Timestamp when the item was last updated",
    )
