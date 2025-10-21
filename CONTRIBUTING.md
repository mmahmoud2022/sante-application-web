# Contributing to Santé Medical Application

We love your input! We want to make contributing to Santé as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mmahmoud2022/sante-application-web.git
   cd sante-application-web
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Code Style

#### Python (Backend)
- Follow PEP 8 style guide
- Use Black for code formatting: `black app/`
- Use isort for import sorting: `isort app/`
- Use flake8 for linting: `flake8 app/`
- Use mypy for type checking: `mypy app/`

#### TypeScript/JavaScript (Frontend)
- Follow the Airbnb JavaScript Style Guide
- Use ESLint for linting: `npm run lint`
- Use Prettier for formatting (integrated with ESLint)
- Use TypeScript strict mode

### Testing

#### Backend Tests
```bash
cd backend
pytest --cov=app tests/
```

#### Frontend Tests
```bash
cd frontend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
```

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add user authentication endpoint

- Implement JWT token generation
- Add password hashing with bcrypt
- Create login and register endpoints

Fixes #123
```

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Security

If you discover a security vulnerability, please send an e-mail to security@sante-app.com. All security vulnerabilities will be promptly addressed.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with your question or contact the maintainers directly.
