from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, reports_views
from .views import (
    UserViewSet, MasterLocationViewSet, MasterSourceViewSet,
    MasterInternalVehicleViewSet, MasterVendorVehicleViewSet,
    RateHistoryInternalVehicleViewSet, RateHistoryVendorViewSet,
    RateHistoryPipelineViewSet, WaterEntryViewSet,
    YieldLocationViewSet, YieldEntryViewSet,
    ConsumptionCategoryViewSet, ConsumptionLocationViewSet, ConsumptionEntryViewSet,
    GeneralWaterRateViewSet, CategoryStudentCountViewSet,
    ProcurementEntryViewSet, BudgetApprovedViewSet,
    CalculateCostView, GetLastPipelineReadingView, GetLastYieldReadingView,
    GetLastConsumptionReadingView, dashboard_stats,
    dropdown_data, login_view, multi_month_stats
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'locations', MasterLocationViewSet)
router.register(r'sources', MasterSourceViewSet)
router.register(r'internal-vehicles', MasterInternalVehicleViewSet)
router.register(r'vendor-vehicles', MasterVendorVehicleViewSet)
router.register(r'rates/internal', RateHistoryInternalVehicleViewSet)
router.register(r'rates/vendor', RateHistoryVendorViewSet)
router.register(r'rates/pipeline', RateHistoryPipelineViewSet)
router.register(r'entries', WaterEntryViewSet)
router.register(r'yield-locations', YieldLocationViewSet)
router.register(r'yield-entries', YieldEntryViewSet)
router.register(r'consumption-categories', ConsumptionCategoryViewSet)
router.register(r'consumption-locations', ConsumptionLocationViewSet)
router.register(r'consumption-entries', ConsumptionEntryViewSet)
router.register(r'general-water-rates', GeneralWaterRateViewSet)
router.register(r'category-student-counts', CategoryStudentCountViewSet)
router.register(r'procurement', ProcurementEntryViewSet)
router.register(r'budget', BudgetApprovedViewSet)
router.register(r'password-reset-requests', views.AdminPasswordResetViewSet, basename='password-reset-requests')



urlpatterns = [
    path('', include(router.urls)),
    path('login', login_view, name='login'),
    path('calculate-cost', CalculateCostView.as_view(), name='calculate-cost'),
    path('last-pipeline-reading', GetLastPipelineReadingView.as_view(), name='last-pipeline-reading'),
    path('last-yield-reading', GetLastYieldReadingView.as_view(), name='last-yield-reading'),
    path('last-consumption-reading', GetLastConsumptionReadingView.as_view(), name='last-consumption-reading'),
    path('dashboard-stats', dashboard_stats, name='dashboard-stats'),
    path('dashboard/multi-month-stats', multi_month_stats, name='multi-month-stats'),
    path('dropdown-data', dropdown_data, name='dropdown-data'),
    # Report endpoints
    path('reports/monthly-summary/', reports_views.MonthlySummaryReportView.as_view(), name='monthly-summary'),
    path('reports/daily-movement/', reports_views.DailyMovementReportView.as_view(), name='daily-movement'),
    path('reports/daily-yield/', reports_views.DailyYieldReportView.as_view(), name='daily-yield'),
    path('reports/daily-normal-consumption/', reports_views.DailyNormalConsumptionReportView.as_view(), name='daily-normal-consumption'),
    path('reports/yearly-trend/', reports_views.YearlyTrendReportView.as_view(), name='yearly-trend'),
    path('reports/water-type/', reports_views.WaterTypeConsumptionReportView.as_view(), name='water-type-report'),
    path('reports/vendor-usage/', reports_views.VendorUsageReportView.as_view(), name='vendor-usage'),
    path('reports/vehicle-utilization/', reports_views.VehicleUtilizationReportView.as_view(), name='vehicle-utilization'),
    path('reports/cost-comparison/', reports_views.CostComparisonReportView.as_view(), name='cost-comparison'),
    path('reports/site-consumption/', reports_views.SiteConsumptionReportView.as_view(), name='site-consumption'),
    path('reports/capacity-utilization/', reports_views.CapacityUtilizationReportView.as_view(), name='capacity-utilization'),
    path('reports/site-detail/<int:location_id>/', reports_views.SiteDetailReportView.as_view(), name='site-detail'),
    path('reports/vendor-detail/<int:vendor_id>/', reports_views.VendorDetailReportView.as_view(), name='vendor-detail'),
    path('reports/rate-details/', reports_views.RateDetailsReportView.as_view(), name='rate-details'),
    path('reports/category-monthly-breakdown/', reports_views.CategoryMonthlyBreakdownReportView.as_view(), name='category-monthly-breakdown'),
    path('reports/procurement/', reports_views.ProcurementReportView.as_view(), name='procurement-report'),
    path('reports/muthu-nagar-building-wise/', reports_views.MuthuNagarBuildingWiseReportView.as_view(), name='muthu-nagar-building-wise'),
    path('reports/bannari-building-wise/', reports_views.BannariBuildingWiseReportView.as_view(), name='bannari-building-wise'),
    
    # Auth endpoints
    path('auth/request-password-reset/', views.RequestPasswordResetView.as_view(), name='request-password-reset'),

    # System endpoints
    path('system/backup/', views.DatabaseBackupView.as_view(), name='database-backup'),
    path('system/restore/', views.DatabaseRestoreView.as_view(), name='database-restore'),
    path('system/reset/', views.DatabaseResetView.as_view(), name='database-reset'),
]

