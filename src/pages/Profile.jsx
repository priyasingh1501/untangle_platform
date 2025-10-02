import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { buildApiUrl } from '../config';
import { 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  Crown, 
  CheckCircle, 
  Clock,
  Settings,
  Camera,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { componentStyles, colors, typography } from '../styles/designTokens';
import { Button, Input, Card, Badge } from '../components/ui';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    profilePicture: ''
  });

  // Subscription states
  const [subscription, setSubscription] = useState({
    plan: 'trial', // trial, monthly, yearly
    status: 'active', // active, cancelled, expired
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    nextBillingDate: null,
    amount: 0
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || ''
      });
    }
  }, [user]);

  // Fetch subscription and billing data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoadingSubscription(true);
        
        // Fetch subscription details
        const subscriptionResponse = await axios.get(buildApiUrl('/api/billing/subscription'));
        if (subscriptionResponse.data.success) {
          setSubscription(subscriptionResponse.data.subscription);
        }

        // Fetch billing history
        const billingResponse = await axios.get(buildApiUrl('/api/billing/payments'));
        if (billingResponse.data.success) {
          setBillingHistory(billingResponse.data.payments);
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription data');
      } finally {
        setLoadingSubscription(false);
      }
    };

    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || ''
    });
    setIsEditing(false);
  };

  const handlePayment = async (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(buildApiUrl('/api/billing/create-payment-intent'), {
        plan: selectedPlan,
        paymentMethod: 'card',
      });
      if (!data?.success) {
        toast.error('Failed to create order');
        return;
      }

      const { keyId, orderId, amount, currency } = data.razorpay;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Lyfe',
        description: `Lyfe ${selectedPlan} subscription`,
        order_id: orderId,
        prefill: {
          name: `${profileData.firstName} ${profileData.lastName}`.trim() || 'Lyfe User',
          email: profileData.email,
        },
        theme: { color: '#22C55E' },
        handler: async (response) => {
          try {
            const verify = await axios.post(buildApiUrl('/api/billing/verify-payment'), {
              ...response,
              plan: selectedPlan,
            });
            if (verify.data.success) {
              setSubscription(verify.data.subscription);
              setShowPaymentModal(false);
              toast.success('Payment successful!');
            } else {
              toast.error('Verification failed');
            }
          } catch (e) {
            toast.error('Verification failed');
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      if (!window.Razorpay) {
        toast.error('Razorpay SDK not loaded');
        setLoading(false);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = () => {
    const plan = subscription?.plan;
    const status = subscription?.status;
    const trialEndsAtDate = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;

    if (plan === 'trial') {
      const msRemaining = trialEndsAtDate ? (trialEndsAtDate.getTime() - Date.now()) : 0;
      const daysLeft = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      return {
        text: `Trial ends in ${daysLeft} days`,
        color: 'yellow',
        icon: Clock
      };
    } else if (status === 'active') {
      return {
        text: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} subscription active`,
        color: 'green',
        icon: CheckCircle
      };
    } else {
      return {
        text: 'Subscription expired',
        color: 'red',
        icon: X
      };
    }
  };

  const status = getSubscriptionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-background-primary p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">
            Profile Settings
          </h1>
          <p className="text-text-secondary">
            Manage your account information and subscription
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <User size={20} />
                  Personal Information
                </h2>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    Edit
                  </Button>
                )}
              </div>

              {/* Profile Picture */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#1E49C9] to-[#1E49C9] rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {profileData.profilePicture ? (
                      <img
                        src={profileData.profilePicture}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-bold">
                        {(profileData.firstName?.[0] || 'U').toUpperCase()}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1E49C9] rounded-full flex items-center justify-center text-white hover:bg-[#1E49C9]/90 transition-colors">
                      <Camera size={12} />
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    {profileData.firstName} {profileData.lastName}
                  </h3>
                  <p className="text-text-secondary">{profileData.email}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    First Name
                  </label>
                  <Input
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Last Name
                  </label>
                  <Input
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email
                  </label>
                  <Input
                    value={profileData.email}
                    disabled
                    className="bg-background-secondary"
                    placeholder="Enter email"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-3 py-2 bg-[#0A0C0F] border border-[#2A313A] rounded-lg text-[#E8EEF2] focus:border-[#FFD200] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Subscription & Billing */}
          <div className="space-y-6">
            {/* Current Subscription */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Crown size={20} />
                  Subscription
                </h3>
                <Badge
                  variant={status.color}
                  className="flex items-center gap-1"
                >
                  <StatusIcon size={12} />
                  {status.text}
                </Badge>
              </div>

              {loadingSubscription ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-background-secondary rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-background-secondary rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-background-secondary rounded w-2/3"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Plan:</span>
                    <span className="text-text-primary font-medium">
                      {subscription.plan === 'trial' ? 'Free Trial' : 
                       subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'}
                    </span>
                  </div>
                  {subscription.plan === 'trial' && subscription.trialEndsAt && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Trial ends:</span>
                      <span className="text-text-primary font-medium">
                        {new Date(subscription.trialEndsAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {subscription.nextBillingDate && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Next billing:</span>
                      <span className="text-text-primary font-medium">
                        {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Amount:</span>
                    <span className="text-text-primary font-medium">
                      ₹{subscription.amount}/{subscription.plan === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                </div>
              )}

              {subscription.plan === 'trial' && (
                <Button
                  onClick={() => handlePayment('monthly')}
                  className="w-full mt-4"
                >
                  Upgrade Now
                </Button>
              )}
            </Card>

            {/* Billing History */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CreditCard size={20} />
                Billing History
              </h3>
              {billingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard size={48} className="mx-auto text-text-muted mb-4" />
                  <p className="text-text-secondary">No billing history yet</p>
                  <p className="text-sm text-text-muted">
                    Your billing history will appear here once you subscribe
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {billingHistory.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                      <div>
                        <p className="text-text-primary font-medium">
                          {payment.description || `${payment.plan} subscription`}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-primary font-medium">
                          ₹{payment.amount}
                        </p>
                        <Badge 
                          variant={payment.status === 'completed' ? 'green' : 
                                  payment.status === 'failed' ? 'red' : 'yellow'}
                          className="text-xs"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary border border-border-primary rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text-primary">
                  Choose Your Plan
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Monthly Plan */}
                <div
                  className={cn(
                    "border rounded-xl p-4 cursor-pointer transition-all",
                    selectedPlan === 'monthly'
                      ? "border-accent-green bg-[#1E49C9]/10"
                      : "border-border-primary hover:border-[#1E49C9]/50"
                  )}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-text-primary">Monthly Plan</h4>
                      <p className="text-sm text-text-secondary">Billed monthly</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-text-primary">₹499</div>
                      <div className="text-sm text-text-secondary">per month</div>
                    </div>
                  </div>
                </div>

                {/* Yearly Plan */}
                <div
                  className={cn(
                    "border rounded-xl p-4 cursor-pointer transition-all",
                    selectedPlan === 'yearly'
                      ? "border-accent-green bg-[#1E49C9]/10"
                      : "border-border-primary hover:border-[#1E49C9]/50"
                  )}
                  onClick={() => setSelectedPlan('yearly')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-text-primary">Yearly Plan</h4>
                      <p className="text-sm text-text-secondary">Billed annually</p>
                      <Badge variant="green" className="mt-1">Save 17%</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-text-primary">₹4,999</div>
                      <div className="text-sm text-text-secondary">per year</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={processPayment}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
