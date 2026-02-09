'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, signOut } from '@/services/auth';

interface Booking {
  id: string;
  title: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

interface Review {
  id: string;
  userName: string;
  comment: string;
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingPayments: 0,
    completedPayments: 0,
  });
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Mock data - replace with actual API calls
      setUpcomingBookings([
        { id: '1', title: 'Family Portrait Session', date: 'April 15, 2023', status: 'confirmed' },
        { id: '2', title: 'Corporate Event', date: 'March 12, 2023', status: 'pending' },
        { id: '3', title: 'Wedding Photography', date: 'April 17, 2023', status: 'confirmed' },
        { id: '4', title: 'Product Shoot', date: 'April 17, 2023', status: 'cancelled' },
      ]);

      setBookingHistory([
        { id: '5', title: 'Family Portrait Session', date: 'April 10, 2023', status: 'completed' },
        { id: '6', title: 'Corporate Event', date: 'March 15, 2023', status: 'completed' },
        { id: '7', title: 'Fashion Photoshoot', date: 'February 12, 2023', status: 'cancelled' },
        { id: '8', title: 'Birthday Party Photography', date: 'January 22, 2023', status: 'completed' },
      ]);

      setStats({
        totalBookings: 5,
        pendingPayments: 1,
        completedPayments: 4,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status as keyof typeof statusStyles]}`}>
        Status: {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed' || status === 'confirmed') {
      return (
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (status === 'cancelled') {
      return (
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    return null;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            ShutterLink
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/bookings" className="text-gray-600 hover:text-gray-900">Bookings</Link>
            <Link href="/payment-status" className="text-gray-600 hover:text-gray-900">Payment Status</Link>
            <Link href="/reviews" className="text-gray-600 hover:text-gray-900">Reviews</Link>
            <Link href="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
            <button 
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section - Updated to match gray background */}
        <div className="bg-gray-600 rounded-lg shadow-sm p-8 mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Your Dashboard</h1>
          <p className="text-gray-200 mb-6">Manage your bookings, check payment statuses, and leave reviews</p>
          <div className="flex justify-center space-x-4">
            <button className="px-6 py-2 bg-transparent border border-white rounded-md text-white hover:bg-white hover:text-gray-600 transition-colors">
              View Account
            </button>
            <button className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors">
              View Portfolio
            </button>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Bookings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <div className="text-center">
                    <div className="text-red-500 font-bold text-xs">FEB</div>
                    <div className="text-2xl font-bold text-gray-900">17</div>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{booking.title}</h3>
                <p className="text-sm text-gray-600 mb-3">Date: {booking.date}</p>
                {getStatusBadge(booking.status)}
              </div>
            ))}
          </div>
        </section>

        {/* Booking History */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bookingHistory.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm p-6 text-center">
                {getStatusIcon(booking.status)}
                <h3 className="font-semibold text-gray-900 mb-2">{booking.title}</h3>
                <p className="text-sm text-gray-600">Date: {booking.date}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Status */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Status</h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <p className="text-center text-gray-600 mb-6">
              Check your payment statuses for services, and resolve outstanding...
            </p>
            <div className="grid grid-cols-3 gap-8 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Pending Payments</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingPayments}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Completed Payments</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedPayments}</p>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <button className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                View Payment History
              </button>
              <button className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800">
                Resolve Issues
              </button>
            </div>
          </div>
        </section>

        {/* Leave a Review */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Leave a Review</h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <p className="text-center text-gray-600 mb-6">
              Share your experience with photographers you've booked
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-3"></div>
                <p className="font-semibold text-gray-900">Jane Smith</p>
                <p className="text-sm text-gray-600">&quot;My service was amazing &amp;...&quot;</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-3"></div>
                <p className="font-semibold text-gray-900">John Doe</p>
                <p className="text-sm text-gray-600">&quot;Had a great experience; will definitely...&quot;</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-3"></div>
                <p className="font-semibold text-gray-900">Alice Johnson</p>
                <p className="text-sm text-gray-600">&quot;The photographer was very professional&quot;</p>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <button className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                View Past Reviews
              </button>
              <button className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800">
                Submit Review
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
