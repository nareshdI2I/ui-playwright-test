export const suitesCollection = {
  LoginRegression: {
    Smoke: [
      'tests/demoqa/login.e2e.spec.ts',
      //'tests/login.spec.ts',
    ],
    Full: [
      'tests/demoqa/login.e2e.spec.ts',
      'tests/demoqa/login.spec.ts',
    ],
  },
  DashBoardMenu: {
    Smoke: [
      'tests/demoqa/dashboard.spec.ts'
    ],
    Full: [
      'tests/demoqa/dashboard.spec.ts'
    ]
  },
  W3Schools: {
    Smoke: [
      'tests/w3schools/w3schools-recorder-test.spec.ts'
    ]
  }
}; 