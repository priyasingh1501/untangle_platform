# Untangle - Comprehensive Lifestyle Management Application

Untangle is a full-stack web application designed to help individuals manage every aspect of their lifestyle, from time management and task organization to health tracking, financial management, and relationship maintenance.

## 🌟 Features

### Core Management Areas

#### 1. **Time & Energy Management**
- Schedule management with recurring events
- Time blocking for focused work sessions
- Energy level tracking throughout the day
- Focus session monitoring with productivity metrics
- Smart scheduling based on energy patterns

#### 2. **Task Management**
- Comprehensive task organization with categories
- Priority and energy level-based task sorting
- Subtask management and progress tracking
- Recurring task automation
- Task dependencies and blocking relationships

#### 3. **Health & Wellness**
- Workout logging with exercise details
- Meal planning and nutrition tracking
- Health metrics monitoring (weight, sleep, stress)
- Medication and symptom tracking
- Health goal setting and progress

#### 4. **Financial Management**
- Expense and income tracking
- Budget creation and monitoring
- Financial goal setting
- Account management
- Spending analysis and insights

#### 5. **Document Management**
- Secure storage for important documents
- Medical bills and prescriptions
- Insurance documents and policies
- Legal documents and contracts
- Document expiry tracking and reminders

#### 6. **Relationship Management**
- Contact management for personal and professional relationships
- Communication history logging
- Important date tracking (birthdays, anniversaries)
- Gift planning and social event organization
- Relationship quality monitoring

#### 7. **Household Communication**
- Maid and cook communication management
- Task instructions and feedback
- Grocery ordering and management
- Service provider coordination
- Payment tracking for household services

## 🚀 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **Nodemailer** for email notifications

### Frontend
- **React 18** with modern hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for data fetching
- **React Hook Form** for form management
- **Lucide React** for icons

### Development Tools
- **Nodemon** for server development
- **Concurrently** for running both servers
- **ESLint** for code quality
- **PostCSS** and **Autoprefixer**

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn** package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd untangle
```

### 2. Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
npm run install-all
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/untangle

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

### 5. Run the Application

#### Development Mode (Both servers)
```bash
npm run dev
```

#### Individual Servers
```bash
# Backend only
npm run server

# Frontend only
npm run client
```

#### Production Build
```bash
npm run build
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🏗️ Project Structure

```
untangle/
├── server/                 # Backend server
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Custom middleware
│   └── index.js          # Server entry point
├── client/                # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── utils/        # Utility functions
│   │   └── App.js        # Main app component
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── package.json           # Root package.json
└── README.md             # This file
```

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Registration**: Users can create accounts with email and password
2. **Login**: Secure authentication with JWT tokens
3. **Protected Routes**: All main features require authentication
4. **Token Refresh**: Automatic token refresh for seamless experience

## 📱 Key Components

### Dashboard
- Overview of all lifestyle areas
- Quick action buttons
- Recent activity feed
- Progress tracking
- Upcoming events

### Task Management
- Create, edit, and delete tasks
- Categorize by priority and energy level
- Set due dates and reminders
- Track completion status
- Bulk operations

### Time Management
- Calendar view for scheduling
- Time blocking interface
- Energy level tracking
- Focus session timer
- Productivity analytics

### Health Tracking
- Workout logging with exercises
- Meal planning and nutrition
- Health metrics dashboard
- Goal setting and progress
- Medical record management

### Financial Dashboard
- Expense and income tracking
- Budget visualization
- Financial goal progress
- Account balances
- Spending insights

## 🎨 UI/UX Features

- **Responsive Design**: Works on all device sizes
- **Dark/Light Mode**: User preference support
- **Smooth Animations**: Framer Motion integration
- **Accessibility**: WCAG compliant design
- **Custom Components**: Tailwind CSS utility classes
- **Modern Interface**: Clean, intuitive design

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication
- **Input Validation**: Server-side validation
- **CORS Protection**: Cross-origin request handling
- **File Upload Security**: Secure file handling
- **Environment Variables**: Sensitive data protection

## 📊 Data Models

### User Management
- Profile information
- Preferences and settings
- Emergency contacts
- Authentication data

### Task System
- Task details and metadata
- Subtasks and dependencies
- Progress tracking
- Reminders and notifications

### Health Tracking
- Workout sessions
- Meal logs
- Health metrics
- Medical records

### Financial Management
- Expenses and income
- Budgets and goals
- Account information
- Transaction history

### Document Storage
- File metadata
- Security settings
- Expiry tracking
- Access permissions

## 🚀 Deployment

### Environment Variables
Set appropriate environment variables for production:

```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
```

### Build Process
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Docker Support (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔮 Future Enhancements

- **Mobile App**: React Native version
- **AI Integration**: Smart recommendations
- **Analytics Dashboard**: Advanced insights
- **Integration APIs**: Third-party service connections
- **Offline Support**: PWA capabilities
- **Multi-language**: Internationalization support

## 📈 Performance Features

- **Lazy Loading**: Component and route optimization
- **Caching**: React Query for data management
- **Image Optimization**: Responsive image handling
- **Code Splitting**: Bundle optimization
- **Database Indexing**: Query performance optimization

---

**Untangle** - Transform your lifestyle management with intelligent organization and tracking tools. 🚀
