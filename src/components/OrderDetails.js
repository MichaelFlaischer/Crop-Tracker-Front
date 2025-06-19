import React, { useState } from 'react';

const statusToHebrew = (status) => {
  switch (status) {
    case 'draft':
      return 'טיוטה';
    case 'confirmed':
      return 'מאושר';
    case 'cancelled':
      return 'בוטל';
    // הוסף סטטוסים נוספים במידת הצורך
    default:
      return status;
  }
};

const OrderDetails = ({ order }) => {
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelOrder = () => {
    setShowCancelReason(true);
  };

  const handleReasonChange = (e) => {
    setCancelReason(e.target.value);
  };

  const handleSubmitCancel = () => {
    // כאן תוכל לקרוא ל-API לביטול ההזמנה עם סיבה
    // לדוג' cancelOrder(order.id, cancelReason)
    setShowCancelReason(false);
    setCancelReason('');
    alert('ההזמנה בוטלה');
  };

  return (
    <div>
      <h2>פרטי הזמנה</h2>
      <div>
        <strong>סטטוס:</strong> {statusToHebrew(order.status)}
      </div>
      {/* הצגת כפתור ביטול רק אם ההזמנה בטיוטה */}
      {order.status === 'draft' && !showCancelReason && (
        <button onClick={handleCancelOrder}>ביטול הזמנה</button>
      )}
      {/* טופס להזנת סיבה לביטול */}
      {showCancelReason && (
        <div>
          <label>
            סיבה לביטול:
            <input
              type="text"
              value={cancelReason}
              onChange={handleReasonChange}
              required
            />
          </label>
          <button onClick={handleSubmitCancel} disabled={!cancelReason}>
            אשר ביטול
          </button>
          <button onClick={() => setShowCancelReason(false)}>
            ביטול
          </button>
        </div>
      )}
      {/* ...שאר פרטי ההזמנה... */}
    </div>
  );
};

export default OrderDetails;