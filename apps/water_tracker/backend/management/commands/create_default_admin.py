"""
Management command to create a default admin user if none exists.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
import os


class Command(BaseCommand):
    help = 'Create a default admin user if no users exist'

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.exists():
            username = os.environ.get('DJANGO_ADMIN_USER', 'admin')
            password = os.environ.get('DJANGO_ADMIN_PASSWORD', 'admin123')
            email = os.environ.get('DJANGO_ADMIN_EMAIL', 'admin@example.com')
            User.objects.create_superuser(username=username, password=password, email=email)
            self.stdout.write(self.style.SUCCESS(f'Created default admin user: {username}'))
        else:
            self.stdout.write('Users already exist, skipping default user creation.')
