Feature: Access Stats Page

  Scenario: Successful login and navigation to Stats page
    Given A registered user with valid credentials
    When I log in and click on the "Stats" link in the navbar
    Then I should be redirected to the stats page