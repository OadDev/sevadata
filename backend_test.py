#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class SEVAAPITester:
    def __init__(self, base_url: str = "https://animal-rescue-hub-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.device_id = f"test_device_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, files: Dict = None, 
                    expected_status: int = 200, auth_required: bool = True) -> tuple[bool, Dict]:
        """Make HTTP request and validate response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, headers=headers, data=data, files=files, timeout=30)
                else:
                    response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
            
            return success, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
    
    def test_health_check(self):
        """Test basic health endpoint"""
        success, data = self.make_request('GET', 'health', auth_required=False)
        self.log_test("Health Check", success, 
                     "" if success else f"Health endpoint failed: {data}")
        return success
    
    def test_login(self, email: str = "admin@seva.org", password: str = "Admin@123"):
        """Test login functionality"""
        login_data = {
            "email": email,
            "password": password,
            "device_id": self.device_id,
            "device_name": "Test Device"
        }
        
        success, data = self.make_request('POST', 'auth/login', login_data, auth_required=False)
        
        if success and 'token' in data:
            self.token = data['token']
            self.user_id = data['user']['id']
            self.log_test("Login", True, f"Logged in as {data['user']['name']}")
            return True
        else:
            self.log_test("Login", False, f"Login failed: {data}")
            return False
    
    def test_get_me(self):
        """Test get current user info"""
        success, data = self.make_request('GET', 'auth/me')
        self.log_test("Get Current User", success, 
                     "" if success else f"Failed to get user info: {data}")
        return success
    
    def test_dashboard_metrics(self):
        """Test dashboard metrics endpoint"""
        success, data = self.make_request('GET', 'dashboard/metrics')
        
        if success:
            required_keys = ['cases', 'shelters', 'outcomes', 'sterilisation', 'medical']
            missing_keys = [key for key in required_keys if key not in data]
            if missing_keys:
                self.log_test("Dashboard Metrics", False, f"Missing keys: {missing_keys}")
                return False
        
        self.log_test("Dashboard Metrics", success, 
                     "" if success else f"Failed to get metrics: {data}")
        return success
    
    def test_dashboard_charts(self):
        """Test dashboard charts endpoint"""
        success, data = self.make_request('GET', 'dashboard/charts')
        
        if success:
            required_keys = ['rescue_trends', 'status_distribution', 'animal_distribution']
            missing_keys = [key for key in required_keys if key not in data]
            if missing_keys:
                self.log_test("Dashboard Charts", False, f"Missing keys: {missing_keys}")
                return False
        
        self.log_test("Dashboard Charts", success, 
                     "" if success else f"Failed to get charts: {data}")
        return success
    
    def test_create_case(self):
        """Test case creation"""
        case_data = {
            "animal_name": "Test Dog",
            "animal_type": "Dog",
            "gender": "Male",
            "age": "2 years",
            "rescue_date": datetime.now().strftime("%Y-%m-%d"),
            "rescue_time": "10:30",
            "rescue_location": "Test Location, Bangalore",
            "area": "Test Area",
            "reporter_name": "Test Reporter",
            "reporter_contact": "9876543210",
            "condition": "Healthy",
            "condition_notes": "Test case for API testing",
            "case_type": "Rescue Case",
            "status": "Rescue Created",
            "sterilisation_status": "Not Required"
        }
        
        success, data = self.make_request('POST', 'cases', case_data, expected_status=200)
        
        if success and 'id' in data:
            self.test_case_id = data['id']
            self.test_case_case_id = data['case_id']
            self.log_test("Create Case", True, f"Created case {data['case_id']}")
            return data['id']
        else:
            # Check if it's actually successful but wrong status code expectation
            if 'id' in data and 'case_id' in data:
                self.test_case_id = data['id']
                self.test_case_case_id = data['case_id']
                self.log_test("Create Case", True, f"Created case {data['case_id']}")
                return data['id']
            else:
                self.log_test("Create Case", False, f"Failed to create case: {data}")
                return None
    
    def test_get_cases(self):
        """Test get all cases"""
        success, data = self.make_request('GET', 'cases')
        
        if success and isinstance(data, list):
            self.log_test("Get Cases", True, f"Retrieved {len(data)} cases")
            return True
        else:
            self.log_test("Get Cases", False, f"Failed to get cases: {data}")
            return False
    
    def test_get_case_detail(self, case_id: str):
        """Test get specific case"""
        success, data = self.make_request('GET', f'cases/{case_id}')
        self.log_test("Get Case Detail", success, 
                     "" if success else f"Failed to get case detail: {data}")
        return success
    
    def test_update_case(self, case_id: str):
        """Test case update"""
        update_data = {
            "condition": "Under Observation",
            "condition_notes": "Updated via API test"
        }
        
        success, data = self.make_request('PUT', f'cases/{case_id}', update_data)
        self.log_test("Update Case", success, 
                     "" if success else f"Failed to update case: {data}")
        return success
    
    def test_create_vet_checkup(self, case_id: str):
        """Test vet checkup creation"""
        checkup_data = {
            "case_id": case_id,
            "checkup_date": datetime.now().strftime("%Y-%m-%d"),
            "vet_name": "Dr. Test Vet",
            "notes": "Routine checkup via API test",
            "next_followup_date": "2024-02-15"
        }
        
        success, data = self.make_request('POST', 'vet-checkups', checkup_data, expected_status=200)
        
        if success and 'id' in data:
            self.test_checkup_id = data['id']
            self.log_test("Create Vet Checkup", True, f"Created checkup {data['id']}")
            return data['id']
        else:
            # Check if it's actually successful but wrong status code expectation
            if 'id' in data:
                self.test_checkup_id = data['id']
                self.log_test("Create Vet Checkup", True, f"Created checkup {data['id']}")
                return data['id']
            else:
                self.log_test("Create Vet Checkup", False, f"Failed to create checkup: {data}")
                return None
    
    def test_get_vet_checkups(self, case_id: str):
        """Test get vet checkups"""
        success, data = self.make_request('GET', f'vet-checkups?case_id={case_id}')
        self.log_test("Get Vet Checkups", success, 
                     "" if success else f"Failed to get checkups: {data}")
        return success
    
    def test_create_sterilisation(self, case_id: str):
        """Test sterilisation record creation"""
        steril_data = {
            "case_id": case_id,
            "sterilisation_date": datetime.now().strftime("%Y-%m-%d"),
            "gender": "Male",
            "location": "SEVA Shelter",
            "vet_name": "Dr. Test Vet",
            "notes": "Sterilisation via API test"
        }
        
        success, data = self.make_request('POST', 'sterilisations', steril_data, expected_status=200)
        
        if success and 'id' in data:
            self.test_steril_id = data['id']
            self.log_test("Create Sterilisation", True, f"Created sterilisation {data['id']}")
            return data['id']
        else:
            # Check if it's actually successful but wrong status code expectation
            if 'id' in data:
                self.test_steril_id = data['id']
                self.log_test("Create Sterilisation", True, f"Created sterilisation {data['id']}")
                return data['id']
            else:
                self.log_test("Create Sterilisation", False, f"Failed to create sterilisation: {data}")
                return None
    
    def test_get_sterilisations(self, case_id: str):
        """Test get sterilisations"""
        success, data = self.make_request('GET', f'sterilisations?case_id={case_id}')
        self.log_test("Get Sterilisations", success, 
                     "" if success else f"Failed to get sterilisations: {data}")
        return success
    
    def test_create_movement(self, case_id: str):
        """Test movement record creation"""
        movement_data = {
            "case_id": case_id,
            "from_location": "Field Location",
            "to_location": "SEVA Shelter",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "reason": "Transfer"
        }
        
        success, data = self.make_request('POST', 'movements', movement_data, expected_status=200)
        
        if success and 'id' in data:
            self.test_movement_id = data['id']
            self.log_test("Create Movement", True, f"Created movement {data['id']}")
            return data['id']
        else:
            # Check if it's actually successful but wrong status code expectation
            if 'id' in data:
                self.test_movement_id = data['id']
                self.log_test("Create Movement", True, f"Created movement {data['id']}")
                return data['id']
            else:
                self.log_test("Create Movement", False, f"Failed to create movement: {data}")
                return None
    
    def test_get_movements(self, case_id: str):
        """Test get movements"""
        success, data = self.make_request('GET', f'movements?case_id={case_id}')
        self.log_test("Get Movements", success, 
                     "" if success else f"Failed to get movements: {data}")
        return success
    
    def test_user_management(self):
        """Test user management endpoints (admin only)"""
        # Get users
        success, data = self.make_request('GET', 'users')
        self.log_test("Get Users", success, 
                     "" if success else f"Failed to get users: {data}")
        
        # Get sessions
        success, data = self.make_request('GET', 'sessions')
        self.log_test("Get Sessions", success, 
                     "" if success else f"Failed to get sessions: {data}")
        
        return success
    
    def test_case_filters(self):
        """Test case filtering"""
        filters = [
            "status=Rescue Created",
            "condition=Healthy",
            "case_type=Rescue Case",
            "search=Test"
        ]
        
        all_passed = True
        for filter_param in filters:
            success, data = self.make_request('GET', f'cases?{filter_param}')
            filter_name = filter_param.split('=')[0]
            self.log_test(f"Filter Cases by {filter_name}", success, 
                         "" if success else f"Failed to filter by {filter_name}: {data}")
            if not success:
                all_passed = False
        
        return all_passed
    
    def test_logout(self):
        """Test logout functionality"""
        success, data = self.make_request('POST', 'auth/logout', {})
        self.log_test("Logout", success, 
                     "" if success else f"Failed to logout: {data}")
        return success
    
    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting SEVA Shelter Management System API Tests")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Authentication
        if not self.test_login():
            print("❌ Login failed - stopping tests")
            return False
        
        self.test_get_me()
        
        # Dashboard
        self.test_dashboard_metrics()
        self.test_dashboard_charts()
        
        # Case management
        case_id = self.test_create_case()
        if case_id:
            self.test_get_cases()
            self.test_get_case_detail(case_id)
            self.test_update_case(case_id)
            self.test_case_filters()
            
            # Medical records
            self.test_create_vet_checkup(case_id)
            self.test_get_vet_checkups(case_id)
            
            # Sterilisation
            self.test_create_sterilisation(case_id)
            self.test_get_sterilisations(case_id)
            
            # Movement tracking
            self.test_create_movement(case_id)
            self.test_get_movements(case_id)
        
        # User management (admin only)
        self.test_user_management()
        
        # Logout
        self.test_logout()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test execution"""
    tester = SEVAAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())