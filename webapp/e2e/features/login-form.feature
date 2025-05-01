Feature: Login Form

  Scenario: Login with valid credentials
    Given A registered user exists
    When I navigate to the login page and login with correct credentials
    Then I should be redirected to the home page