module.exports = {
  suitesCollection: {
    LoginRegression: {
      Smoke: [
        'tests/login.e2e.spec.ts',
        //'tests/login.spec.ts',
      ],
      Full: [
        'tests/login.e2e.spec.ts',
        'tests/login.spec.ts',
      ],
    },
    DashBoardMenu: {
      Smoke: [
        'tests/dashboard.spec.ts'
      ],
      Full: [
        'tests/dashboard.spec.ts'
      ]
    },
    
  },
}; 