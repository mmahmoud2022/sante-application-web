describe('Performance', () => {
  describe('Page Load Times', () => {
    it('should load home page within acceptable time', () => {
      const start = Date.now();
      cy.visit('/');
      const loadTime = Date.now() - start;
      cy.log(`Home page load time: ${loadTime}ms`);
      expect(loadTime).to.be.lessThan(3000);
    });

    it('should load login page within acceptable time', () => {
      const start = Date.now();
      cy.visit('/login');
      const loadTime = Date.now() - start;
      cy.log(`Login page load time: ${loadTime}ms`);
      expect(loadTime).to.be.lessThan(2000);
    });

    it('should load dashboard within acceptable time after login', () => {
      cy.loginAs('patient');
      const start = Date.now();
      cy.visit('/patient/dashboard');
      const loadTime = Date.now() - start;
      cy.log(`Dashboard load time: ${loadTime}ms`);
      expect(loadTime).to.be.lessThan(3000);
    });
  });

  describe('API Response Times', () => {
    beforeEach(() => {
      cy.loginAs('patient');
    });

    it('should load appointments list quickly', () => {
      cy.intercept('GET', '**/appointments/*').as('getAppointments');
      cy.visit('/patient/appointments');
      
      cy.wait('@getAppointments').then((interception) => {
        const responseTime = interception.response?.headers['x-response-time'];
        if (responseTime) {
          const duration = typeof responseTime === 'string' ? parseInt(responseTime) : responseTime;
          cy.log(`Appointments API response time: ${duration}ms`);
          expect(duration).to.be.lessThan(1000);
        }
      });
    });

    it('should load prescriptions list quickly', () => {
      cy.intercept('GET', '**/prescriptions/*').as('getPrescriptions');
      cy.visit('/patient/prescriptions');
      
      cy.wait('@getPrescriptions').then((interception) => {
        const responseTime = interception.response?.headers['x-response-time'];
        if (responseTime) {
          const duration = typeof responseTime === 'string' ? parseInt(responseTime) : responseTime;
          cy.log(`Prescriptions API response time: ${duration}ms`);
          expect(duration).to.be.lessThan(1000);
        }
      });
    });
  });

  describe('Bundle Size', () => {
    it('should not load excessive JavaScript', () => {
      cy.visit('/');
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource');
        const jsResources = resources.filter((r: any) => 
          r.name.endsWith('.js') || r.name.includes('/_next/static')
        );
        
        const totalSize = jsResources.reduce((sum: number, r: any) => 
          sum + (r.transferSize || 0), 0
        );
        
        cy.log(`Total JS size: ${(totalSize / 1024).toFixed(2)} KB`);
        // Should be less than 500KB for initial load
        expect(totalSize).to.be.lessThan(500 * 1024);
      });
    });
  });

  describe('Lazy Loading', () => {
    it('should lazy load images', () => {
      cy.visit('/');
      cy.get('img[loading="lazy"]').should('exist');
    });

    it('should not load off-screen content immediately', () => {
      cy.visit('/');
      // Check that images below the fold are not loaded yet
      cy.get('img').each(($img) => {
        const rect = $img[0].getBoundingClientRect();
        if (rect.top > window.innerHeight) {
          expect($img.attr('src')).to.not.exist;
        }
      });
    });
  });

  describe('Memory Leaks', () => {
    it('should not leak memory on page navigation', () => {
      cy.loginAs('patient');
      
      // Navigate through multiple pages
      cy.visit('/patient/dashboard');
      cy.visit('/patient/appointments');
      cy.visit('/patient/prescriptions');
      cy.visit('/patient/profile');
      cy.visit('/patient/dashboard');
      
      // Check if memory usage is reasonable
      cy.window().then((win) => {
        if (win.performance.memory) {
          const memoryUsage = win.performance.memory.usedJSHeapSize;
          cy.log(`Memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB`);
          // Should be less than 100MB
          expect(memoryUsage).to.be.lessThan(100 * 1024 * 1024);
        }
      });
    });
  });
});
