"""Tests for m01_example_schema module."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.m01_example_schema import (
    ExampleCreate,
    ExampleRead,
    ExampleUpdate,
)


class TestExampleCreate:
    """Tests for ExampleCreate schema."""

    def test_create_with_required_fields_only(self):
        """Test creating schema with only required fields."""
        schema = ExampleCreate(name="Test Item")
        assert schema.name == "Test Item"
        assert schema.description is None
        assert schema.is_active is True

    def test_create_with_all_fields(self):
        """Test creating schema with all fields."""
        schema = ExampleCreate(
            name="Test Item",
            description="Test description",
            is_active=False,
        )
        assert schema.name == "Test Item"
        assert schema.description == "Test description"
        assert schema.is_active is False

    def test_create_name_min_length_validation(self):
        """Test that name must have at least 1 character."""
        with pytest.raises(ValidationError) as exc_info:
            ExampleCreate(name="")
        assert "String should have at least 1 character" in str(exc_info.value)

    def test_create_name_max_length_validation(self):
        """Test that name must not exceed 100 characters."""
        with pytest.raises(ValidationError) as exc_info:
            ExampleCreate(name="a" * 101)
        assert "String should have at most 100 characters" in str(exc_info.value)

    def test_create_description_max_length_validation(self):
        """Test that description must not exceed 500 characters."""
        with pytest.raises(ValidationError) as exc_info:
            ExampleCreate(name="Test", description="a" * 501)
        assert "String should have at most 500 characters" in str(exc_info.value)

    def test_create_missing_required_field(self):
        """Test that name is required."""
        with pytest.raises(ValidationError) as exc_info:
            ExampleCreate()
        assert "name" in str(exc_info.value)


class TestExampleUpdate:
    """Tests for ExampleUpdate schema."""

    def test_update_empty(self):
        """Test creating empty update schema (all fields optional)."""
        schema = ExampleUpdate()
        assert schema.name is None
        assert schema.description is None
        assert schema.is_active is None

    def test_update_partial(self):
        """Test partial update with some fields."""
        schema = ExampleUpdate(name="Updated Name")
        assert schema.name == "Updated Name"
        assert schema.description is None
        assert schema.is_active is None

    def test_update_all_fields(self):
        """Test update with all fields."""
        schema = ExampleUpdate(
            name="Updated Name",
            description="Updated description",
            is_active=False,
        )
        assert schema.name == "Updated Name"
        assert schema.description == "Updated description"
        assert schema.is_active is False

    def test_update_forbids_extra_fields(self):
        """Test that extra fields are forbidden."""
        with pytest.raises(ValidationError) as exc_info:
            ExampleUpdate(name="Test", extra_field="value")
        assert "extra_field" in str(exc_info.value)


class TestExampleRead:
    """Tests for ExampleRead schema."""

    def test_read_with_all_fields(self):
        """Test creating read schema with all fields."""
        now = datetime.now()
        schema = ExampleRead(
            id=1,
            name="Test Item",
            description="Test description",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        assert schema.id == 1
        assert schema.name == "Test Item"
        assert schema.description == "Test description"
        assert schema.is_active is True
        assert schema.created_at == now
        assert schema.updated_at == now

    def test_read_from_orm_mode(self):
        """Test that from_attributes is enabled for ORM compatibility."""

        class MockORM:
            """Mock ORM object."""

            id = 1
            name = "ORM Item"
            description = "ORM description"
            is_active = True
            created_at = datetime.now()
            updated_at = datetime.now()

        schema = ExampleRead.model_validate(MockORM())
        assert schema.id == 1
        assert schema.name == "ORM Item"

    def test_read_missing_required_fields(self):
        """Test that all fields are required."""
        with pytest.raises(ValidationError):
            ExampleRead(name="Test")
