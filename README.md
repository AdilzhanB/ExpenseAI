# 🚀 ExpenseAI - AI-Powered Personal Expense Tracker

<div align="center">
  <img src="https://img.shields.io/badge/React-19.1.0-blue" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-4.9.5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Latest-green" alt="Node.js" />
  <img src="https://img.shields.io/badge/AI_Powered-Google_Gemini-purple" alt="AI Powered" />
  <img src="https://img.shields.io/badge/Database-SQLite3-orange" alt="SQLite3" />
</div>

## ✨ Features

### 🧠 AI-Powered Intelligence
- **Smart Categorization**: Automatically categorizes expenses using Google Gemini AI
- **Financial Insights**: Get personalized recommendations and spending analysis
- **Budget Optimization**: AI-driven budget suggestions based on your spending patterns
- **Health Score**: Real-time financial health assessment
- **Receipt Analysis**: Extract expense data from receipt images (Coming Soon)

### 💰 Core Functionality
- **Expense Tracking**: Add, edit, and delete expenses with ease
- **Category Management**: Custom and default expense categories
- **Budget Management**: Set and track budgets with smart alerts
- **Analytics & Reports**: Beautiful charts and detailed spending insights
- **Real-time Dashboard**: Live overview of your financial status

### 🎨 Modern UI/UX
- **Beautiful Design**: Glassmorphism design with smooth animations
- **Responsive**: Perfect on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Switch between themes seamlessly
- **Framer Motion**: Smooth animations and transitions
- **Tailwind CSS**: Modern, utility-first styling

### 🔒 Security & Performance
- **JWT Authentication**: Secure user authentication
- **Data Encryption**: All sensitive data is encrypted
- **Rate Limiting**: API protection against abuse
- **SQLite Database**: Fast, reliable local database
- **Optimized Performance**: Fast loading and smooth interactions

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Zustand** for state management
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Hook Form** for form handling
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **SQLite3** database
- **Google Gemini AI** integration
- **JWT** authentication
- **bcryptjs** for password hashing
- **Rate limiting** and security middleware

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key (optional, for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/expense-ai.git
cd expense-ai
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your configuration
npm run dev
```

3. **Setup Frontend**
```bash
cd ../web-frontend
npm install
npm start
```

4. **Open your browser**
Visit `http://localhost:3000` to see the application.

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_PATH=./database/expenses.db
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key-here
AI_ENABLED=true
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=ExpenseAI
```

## 📱 Screenshots

### Dashboard
Beautiful overview with AI insights and spending analytics.

### Expense Management
Add expenses with AI-powered categorization.

### AI Insights
Get personalized financial recommendations.

### Analytics
Detailed charts and spending breakdowns.

## 🤖 AI Features

### Smart Categorization
The AI automatically suggests the best category for your expenses based on the description. It learns from your spending patterns to provide better suggestions over time.

### Financial Health Score
Get a real-time score (0-100) that reflects your financial health based on:
- Spending patterns
- Budget adherence
- Savings rate
- Financial goals progress

### Personalized Insights
Receive tailored recommendations such as:
- Budget optimization suggestions
- Spending pattern alerts
- Savings opportunities
- Financial goal recommendations

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Expenses
- `GET /api/expenses` - Get expenses with filters
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats/summary` - Get spending statistics

### AI Features
- `POST /api/ai/analyze-expense` - Analyze expense with AI
- `GET /api/ai/insights` - Get financial insights
- `POST /api/ai/categorize` - Smart categorization
- `GET /api/ai/health-score` - Get financial health score

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create custom category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] Basic expense tracking
- [x] AI categorization
- [x] Beautiful dashboard
- [x] User authentication
- [x] Financial insights

### Phase 2 (Coming Soon) 🚧
- [ ] Receipt scanning with OCR
- [ ] Recurring expense automation
- [ ] Advanced budget features
- [ ] Financial goal tracking
- [ ] Data export/import

### Phase 3 (Future) 🎯
- [ ] Bank account integration
- [ ] Investment tracking
- [ ] Bill reminders
- [ ] Family expense sharing
- [ ] Mobile app

## 🐳 Docker Deployment

### Development with Docker

```bash
# Start development environment
docker-compose up --build

# Or using npm script
npm run docker:dev
```

### Production Deployment

```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Or using deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Docker Configuration

The application includes:
- **Multi-stage builds** for optimized production images
- **Health checks** for container monitoring
- **Nginx reverse proxy** with SSL support
- **Prometheus & Grafana** for monitoring
- **Automated backups** with retention policies

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline automatically:

1. **Testing Phase**
   - Runs unit tests for frontend and backend
   - Performs linting and type checking
   - Generates code coverage reports

2. **Security Phase**
   - Scans for vulnerabilities with Trivy
   - Runs npm audit for dependency security
   - Performs code quality analysis

3. **Build Phase**
   - Builds multi-platform Docker images
   - Pushes to GitHub Container Registry
   - Optimizes for production deployment

4. **Deploy Phase**
   - Deploys to staging environment automatically
   - Requires approval for production deployment
   - Performs health checks post-deployment

### Environment Setup

1. **Staging Environment**
   - Automatic deployment on `develop` branch
   - Used for testing and validation
   - Mirrors production configuration

2. **Production Environment**
   - Manual approval required
   - Deployed from `main` branch
   - Includes rollback capabilities

### Monitoring & Alerts

- **Prometheus** metrics collection
- **Grafana** dashboards for visualization
- **Alert rules** for critical issues
- **Slack notifications** for deployments

## 📊 Performance & Monitoring

### Load Testing

```bash
# Run load tests
npm run load-test

# Custom artillery configuration
artillery run testing/load-test.yml
```

### Monitoring Stack

- **Health Endpoints**: `/health` for container monitoring
- **Metrics**: Prometheus metrics at `/metrics`
- **Logs**: Structured logging with Winston
- **Dashboards**: Grafana dashboards for insights

### Performance Optimization

- **CDN Integration** for static assets
- **Image optimization** for receipt processing
- **Database indexing** for query performance
- **Caching strategies** for AI responses

## 🔒 Security Features

- **JWT Authentication** with secure tokens
- **Password Hashing** with bcrypt
- **Rate Limiting** to prevent abuse
- **CORS Protection** for API security
- **Input Validation** and sanitization
- **File Upload Security** with restrictions
- **SQL Injection Prevention**
- **XSS Protection** headers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powering our AI features
- Tailwind CSS for the amazing styling system
- Framer Motion for smooth animations
- Recharts for beautiful data visualization
- The amazing React and Node.js communities

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Email us at support@expenseai.com
- Join our Discord community

---

<div align="center">
  <p>Made with ❤️ by the ExpenseAI Team</p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>
