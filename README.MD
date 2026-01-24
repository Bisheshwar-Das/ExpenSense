# Expen$ense - Personal Finance Tracker

A modern, feature-rich mobile expense tracking application built with React Native and Expo.

## 📱 Features

### Core Functionality
- ✅ **Transaction Management** - Add, edit, and delete income/expense transactions
- 💳 **Multiple Wallets** - Organize finances across different accounts
- 🎯 **Goals Tracking** - Set savings goals and monthly budgets
- 📊 **Analytics & Reports** - Visual insights into spending patterns
- 💾 **Persistent Storage** - All data saved locally on device

### User Experience
- 🎨 Beautiful, intuitive UI with Tailwind CSS (NativeWind)
- 👆 Swipe-to-delete transactions
- 📱 Responsive design for all screen sizes
- 🔄 Real-time updates across the app
- ⚡ Fast, native performance

## 🛠️ Tech Stack

- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **Navigation:** React Navigation v7
- **State Management:** React Context API
- **Storage:** AsyncStorage
- **Styling:** NativeWind (Tailwind CSS)
- **Gestures:** React Native Gesture Handler

## 📦 Installation

### Prerequisites
- Node.js v20 or higher
- npm or yarn
- Expo Go app (for testing on device)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/expensense.git
   cd expensense
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Scan QR code with Expo Go (Android/iOS)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## 📁 Project Structure

```
expensense/
├── screens/           # Screen components
│   ├── DashboardScreen.tsx
│   ├── AddTransactionScreen.tsx
│   ├── EditTransactionScreen.tsx
│   ├── TransactionDetailsScreen.tsx
│   ├── WalletsScreen.tsx
│   ├── GoalsScreen.tsx
│   ├── ReportsScreen.tsx
│   └── SettingsScreen.tsx
├── components/        # Reusable components
│   ├── CategoryPicker.tsx
│   ├── WalletPicker.tsx
│   ├── DatePicker.tsx
│   ├── WalletModal.tsx
│   ├── GoalModal.tsx
│   └── GoalsSummaryWidget.tsx
├── contexts/          # React Context providers
│   ├── TransactionContext.tsx
│   ├── WalletContext.tsx
│   └── GoalContext.tsx
├── navigation/        # Navigation configuration
│   ├── AppNavigator.tsx
│   └── types.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── App.tsx           # Entry point
└── package.json
```

## 🎯 Core Concepts

### Data Models

#### Transaction
```typescript
{
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  wallet: string;
  date: string;
  notes?: string;
}
```

#### Wallet
```typescript
{
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}
```

#### Goal
```typescript
{
  id: string;
  type: 'savings' | 'budget';
  name: string;
  targetAmount: number;
  currentAmount?: number;
  category?: string;
  period?: 'weekly' | 'monthly' | 'yearly';
  icon: string;
  color: string;
  createdAt: string;
}
```

### State Management

The app uses React Context API for global state:
- **TransactionContext** - Manages all financial transactions
- **WalletContext** - Handles wallet creation and management
- **GoalContext** - Tracks savings goals and budgets

All data is persisted using AsyncStorage and loads on app start.

## 🚀 Features Breakdown

### Dashboard
- Total balance across all wallets
- Income vs Expense summary
- Goals overview widget
- Recent transactions list
- Swipe-to-delete functionality

### Transactions
- Add new income/expense
- Edit existing transactions
- Delete with confirmation
- Category selection
- Wallet assignment
- Date/time picker
- Optional notes

### Wallets
- Create custom wallets
- Assign icons and colors
- View balance per wallet
- Track transaction count
- Edit wallet details

### Goals
- **Savings Goals** - Save for specific items
- **Budget Goals** - Set spending limits per category
- Visual progress tracking
- Over-budget warnings
- Monthly/weekly/yearly budgets

### Reports
- Spending trends chart
- Category breakdown
- Period selection (week/month/year)
- Insights and analytics
- Average daily spending
- Net savings calculation

## 🔧 Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

### Build for Production
```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

## 📝 Roadmap

- [ ] Cloud sync across devices
- [ ] Recurring transactions
- [ ] Data export (CSV/PDF)
- [ ] Dark mode
- [ ] Biometric authentication
- [ ] Multi-currency support
- [ ] Receipt photo capture
- [ ] Budget notifications
- [ ] Spending insights AI

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- Expo team for the amazing framework
- React Navigation for seamless navigation
- NativeWind for Tailwind CSS support
- All open-source contributors

---

Made with ❤️ and TypeScript