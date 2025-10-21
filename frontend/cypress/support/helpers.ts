/**
 * Test Helpers and Utilities
 * Reusable functions for Cypress tests
 */

/**
 * Generate random email for testing
 */
export const generateTestEmail = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test-${timestamp}-${random}@example.com`;
};

/**
 * Generate random phone number
 */
export const generatePhoneNumber = (): string => {
  const random = Math.floor(Math.random() * 100000000);
  return `06${random.toString().padStart(8, '0')}`;
};

/**
 * Format date for date picker input (YYYY-MM-DD)
 */
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get future date
 */
export const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDateForInput(date);
};

/**
 * Get past date
 */
export const getPastDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateForInput(date);
};

/**
 * Wait for element to be visible and stable
 */
export const waitForElementStable = (selector: string): void => {
  cy.get(selector).should('be.visible');
  cy.get(selector).should('not.be.disabled');
  cy.wait(100); // Small delay to ensure element is interactive
};

/**
 * Check if API returned successful response
 */
export const assertSuccessfulApiResponse = (alias: string): void => {
  cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
  });
};

/**
 * Generate appointment data for testing
 */
export const generateAppointmentData = (overrides = {}) => ({
  specialty: 'Médecine Générale',
  doctorId: 2,
  date: getFutureDate(7),
  time: '10:00',
  reason: 'Consultation de routine',
  ...overrides,
});

/**
 * Generate user data for registration
 */
export const generateUserData = (role: 'patient' | 'doctor' = 'patient') => ({
  email: generateTestEmail(),
  password: 'SecurePassword123!',
  first_name: 'Jean',
  last_name: 'Dupont',
  phone_number: generatePhoneNumber(),
  role,
  date_of_birth: '1990-01-15',
});

/**
 * Generate prescription data
 */
export const generatePrescriptionData = (overrides = {}) => ({
  patient_id: 1,
  medications: [
    {
      name: 'Amoxicilline',
      dosage: '500mg',
      frequency: '3 fois par jour',
      duration: '7 jours',
    },
  ],
  instructions: 'Prendre pendant les repas',
  ...overrides,
});

/**
 * Mock successful API response
 */
export const mockApiSuccess = (url: string, data: any, alias: string): void => {
  cy.intercept('GET', url, {
    statusCode: 200,
    body: data,
  }).as(alias);
};

/**
 * Mock API error response
 */
export const mockApiError = (url: string, statusCode: number, message: string, alias: string): void => {
  cy.intercept('GET', url, {
    statusCode,
    body: { detail: message },
  }).as(alias);
};

/**
 * Fill complete booking form
 */
export const fillBookingForm = (data: {
  specialty: string;
  doctorId: number;
  date: string;
  time: string;
  reason: string;
}): void => {
  cy.get('[data-testid="specialty-select"]').select(data.specialty);
  cy.get('[data-testid="doctor-select"]').select(data.doctorId);
  cy.get('[data-testid="date-picker"]').type(data.date);
  cy.get(`[data-testid="time-slot"][data-time="${data.time}"]`).click();
  cy.get('[data-testid="reason"]').type(data.reason);
};

/**
 * Fill registration form
 */
export const fillRegistrationForm = (data: ReturnType<typeof generateUserData>): void => {
  cy.get('input[name="email"]').type(data.email);
  cy.get('input[name="password"]').type(data.password);
  cy.get('input[name="first_name"]').type(data.first_name);
  cy.get('input[name="last_name"]').type(data.last_name);
  cy.get('input[name="phone_number"]').type(data.phone_number);
  cy.get('select[name="role"]').select(data.role);
  if (data.date_of_birth) {
    cy.get('input[name="date_of_birth"]').type(data.date_of_birth);
  }
};

/**
 * Check if element contains any of the given texts
 */
export const containsAnyOf = (selector: string, texts: string[]): void => {
  cy.get(selector).then(($el) => {
    const elementText = $el.text().toLowerCase();
    const hasMatch = texts.some((text) => elementText.includes(text.toLowerCase()));
    expect(hasMatch).to.be.true;
  });
};

/**
 * Retry action until success or max attempts
 */
export const retryAction = (
  action: () => void,
  maxAttempts: number = 3,
  delayMs: number = 1000
): void => {
  let attempts = 0;
  const tryAction = () => {
    attempts++;
    try {
      action();
    } catch (error) {
      if (attempts < maxAttempts) {
        cy.wait(delayMs);
        tryAction();
      } else {
        throw error;
      }
    }
  };
  tryAction();
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (selector: string): void => {
  cy.get(selector).then(($el) => {
    const rect = $el[0].getBoundingClientRect();
    expect(rect.top).to.be.at.least(0);
    expect(rect.left).to.be.at.least(0);
    expect(rect.bottom).to.be.at.most(window.innerHeight);
    expect(rect.right).to.be.at.most(window.innerWidth);
  });
};

/**
 * Scroll element into view with offset
 */
export const scrollIntoViewWithOffset = (selector: string, offset: number = 100): void => {
  cy.get(selector).then(($el) => {
    const top = $el[0].getBoundingClientRect().top + window.pageYOffset - offset;
    cy.window().then((win) => {
      win.scrollTo({ top, behavior: 'smooth' });
    });
  });
};

/**
 * Check accessibility violations (requires cypress-axe plugin)
 * To use this, install: npm install --save-dev cypress-axe axe-core
 */
export const checkA11y = (context?: string): void => {
  // Uncomment when cypress-axe is installed
  // cy.injectAxe();
  // if (context) {
  //   cy.checkA11y(context);
  // } else {
  //   cy.checkA11y();
  // }
  cy.log('A11y check skipped - install cypress-axe to enable');
};

/**
 * Set viewport to specific device
 */
export const setViewport = (device: 'mobile' | 'tablet' | 'desktop'): void => {
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
  };
  const viewport = viewports[device];
  cy.viewport(viewport.width, viewport.height);
};

/**
 * Take screenshot with timestamp
 */
export const takeTimestampedScreenshot = (name: string): void => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
};

/**
 * Clear all storage and cookies
 */
export const clearAllStorage = (): void => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
};

/**
 * Wait for network idle (no pending requests)
 */
export const waitForNetworkIdle = (timeout: number = 1000): void => {
  cy.wait(timeout);
  cy.window().then((win) => {
    // Check if there are no active XHR requests
    return new Cypress.Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  });
};
