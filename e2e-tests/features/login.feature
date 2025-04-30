Feature: Login functionality

  Scenario: User can log in with valid credentials
    Given I am on the login page
    When I enter valid credentials
    Then I should be redirected to the dashboard