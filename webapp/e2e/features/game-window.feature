Feature: Full Game Flow with Lifelines

  Scenario: Complete a game session using different lifelines on each question
    Given A registered user with valid credentials
    When I log in, then navigate to the home page, click "Play", select the "Mixed" category and "Easy" difficulty, use a different lifeline on each question, and finally reach the end-of-game screen after 4 questions
    Then I should see the final game screen with the results
