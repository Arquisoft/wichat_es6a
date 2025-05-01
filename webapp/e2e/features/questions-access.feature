Feature: Access Questions Page

  Scenario: Successful login and navigation to Questions page
    Given A registered user with valid credentials
    When I log in and click on the "Questions" link in the navbar
    Then I should be redirected to the questions page