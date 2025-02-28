# Field Boss Timer

## 📌 Project Description

Field Boss Timer is a web application designed to track the respawn times of bosses in BnS Neo. It allows users to add timers, synchronize in real-time, and adjust notification sounds.

![Alt text](https://img001.prntscr.com/file/img001/P-lC02d3QxqBYrz3Q6BgLA.png)

## 🚀 Features

- ✅ **Add timers** for different bosses and channels
- 🔄 **Real-time synchronization** using Supabase Realtime
- 🎵 **Sound notifications** when a timer is about to expire
- 🔊 **Volume control and sound toggling**
- 📌 **Save user settings** in `localStorage`
- 🌍 **Automatic timer updates** for all users
- 📊 **Optimized database queries** for better performance

## 🛠️ Technology Stack

- **React** – Frontend framework
- **Tailwind CSS** – Styling
- **Supabase** – Database and real-time synchronization
- **LocalStorage** – User settings storage

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/paticzekm/BnsNeoFieldBossTimer
   cd BnsNeoFieldBossTimer
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Check Supabase Setup
4. **Run the application locally:**
   ```bash
   npm start
   ```

## 🔧 Supabase Setup

To use Supabase as the backend for real-time synchronization and database storage, follow these steps:

1. **Create a Supabase Project:**

   - Go to [Supabase](https://supabase.com/)
   - Click on **New Project**
   - Set up your database and project settings

2. **Create the `timers` table:**

   ```sql
   create table timers (
       id uuid default gen_random_uuid() primary key,
       boss text not null,
       channel int not null,
       type text not null,
       end_time bigint not null
   );
   ```

3. **Enable Realtime for `timers` table:**

   - Go to **Database** → **Tables** → Select `timers`
   - Enable **Realtime Subscription**

4. **Set Row Level Security (RLS):**

   - Go to **Authentication** → **Policies**
   - Add a policy to allow users to read and insert records:

   ```sql
   create policy "Enable read access for all users" on timers
   for select using (true);

   create policy "Enable insert access for all users" on timers
   for insert with check (true);
   ```

5. **Get API Keys:**
   - Go to **Project Settings** → **API**
   - Copy the **Anon Key** and **Project URL**
   - Add them to your `src/supabaseClient.js` file

## 🌍 Deployment

The application can be deployed on:

- **Netlify** – Auto-deploy from GitHub
- **Vercel** – Fast hosting for React apps

Database can be deployed on:

- **Supabase Hosting** – Database and API hosting

To build the application:

```bash
npm run build
```

Then upload the `build/` folder to your preferred hosting platform.

## 🛠️ Contribution

1. **Fork the repository**
2. **Create a new branch:**
   ```bash
   git checkout -b feature-name
   ```
3. **Commit your changes:**
   ```bash
   git commit -m "Added a new feature"
   ```
4. **Push changes and create a pull request:**
   ```bash
   git push origin feature-name
   ```

## 📜 License

This project is licensed under the **GNU General Public License v3.0 (GPL v3)**. You can modify and use it under the terms of this license.

---

✉️ **Contact**: If you have any questions or suggestions, reach out via [GitHub Issues](https://github.com/paticzekm/BnsNeoFieldBossTimer/issues).
