# Split It Up App – Group Expense Manager

A mobile application for managing shared expenses between friends. Users can create splits, add members, track shared costs, and view balances within a group. The goal of the project is to simplify group expense tracking while demonstrating secure full-stack application development.

This project was developed using React Native with Expo and integrates with a backend powered by Supabase for authentication and database management.

# Features

- User authentication (sign up and login)

- Create and manage shared expense splits

- View all splits associated with a user

- Add friends through username search

- Secure database access using Row Level Security (RLS)

- Profile page displaying user information

- Backend validation and database integration

# Tech Stack

## Frontend

- React Native

- Expo

- TypeScript

- Expo Router

## Backend

- Supabase

- PostgreSQL Database

- Supabase Authentication

- Row Level Security (RLS)

## Development Tools

- Git / GitHub

- Node.js

- npm

# Project Architecture

The application follows a client–server architecture. The frontend handles user interaction and UI rendering, communicates with Supabase using API calls.

The backend stores application data in a PostgreSQL database, handles authentication and session management, and enforces security through RLS policies.

*Main database tables include:*

profiles – stores user information

splits – stores split metadata

split_members – tracks which users belong to each split

# Installation

Clone the repository:

git clone <repo-url>
cd <project-folder>

Install dependencies:

npm install

Start the development server:

npx expo start

Then open the app using:

Expo Go (mobile device)

Android Emulator

iOS Simulator

# Environment Setup

Create a .env file and add your Supabase credentials:

EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

These keys allow the application to communicate with the backend services.

# Testing

Testing was performed by verifying database operations and frontend interactions, including:

- user authentication

- split creation

- database inserts and queries

- friend search functionality

Console logging and test scripts were used to confirm that data was correctly stored and retrieved from the database.

# Team Members

Prithvi – Authentication system and login functionality

Audrey – Split loading logic, database queries, and RLS policies

Raner – Split creation and backend integration

Elena – Profile page and user search functionality

# Future Improvements

Complete friend request system

Add expense items within splits

Implement balance calculations between users

Improve UI and user experience

Add automated testing

# License

This project was developed for educational purposes.
