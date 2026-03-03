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
            user = User.objects.create_superuser(
                username=username,
                password=password,
                email=email,
                role='Admin',
                can_access_operations=True,
                can_access_master_data=True,
                can_access_reports=True,
                can_manage_users=True,
            )
            self.stdout.write(self.style.SUCCESS(
                f'Created default admin user: {username} (role=Admin)'
            ))
        else:
            # Ensure existing admin user has correct role if it has Viewer role
            admin_user = User.objects.filter(username='admin').first()
            if admin_user and admin_user.role != 'Admin':
                admin_user.role = 'Admin'
                admin_user.can_access_operations = True
                admin_user.can_access_master_data = True
                admin_user.can_access_reports = True
                admin_user.can_manage_users = True
                admin_user.save()
                self.stdout.write(self.style.SUCCESS('Updated admin user role to Admin'))
            else:
                self.stdout.write('Users already exist with correct roles.')
