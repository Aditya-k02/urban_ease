export function getTimeAgo(date){
    const now = new Date(Date.now());
  const diffMs = now - new Date(date);
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60)
    return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""} ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

export function getPaymentRemainders(pending, notifications) { 
    const now = new Date();
  const reminders = [];

  for (const payment of pending) {
    const deadline = new Date(payment.paymentDeadline);
    const diffMs = deadline.getTime() - now.getTime();

    const I = payment.ID || payment.title;
    const amount = payment.amount;

    const isFuture = diffMs >= 0;
    const diffDays = isFuture
      ? Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      : Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const hoursLeft = diffMs / (1000 * 60 * 60);


    if (diffDays === 1 || (diffDays === 0 && hoursLeft > 0)) {
      
      reminders.push({
        n: `Your payment for ${I} of amount ₹${amount} is due tomorrow.`,
        createdAt: new Date(),
        belongs: "Payment",
      });
    } else if (diffDays < 0) {
 

      reminders.push({
        n: `Your payment for ${I} of amount ₹${amount} was due ${Math.abs(diffDays)} day(s) ago.`,
        createdAt: new Date(),
        belongs: "Payment",
      });
    }
  }

  const newReminders = reminders.filter((newR) => {
  const newWords = newR.n.split(" ").slice(0, 5).join(" ");
  return !notifications.some((existingR) => {
    const existingWords = existingR.n.split(" ").slice(0, 5).join(" ");
    return existingWords === newWords;
  });
});


  console.log(reminders);
  

  // Push new reminders into notifications
  notifications.push(...newReminders);

  return reminders;
}

 export async function setPenalties(overdues) { 
    console.log("setting penalties");
  
  for(const o of overdues){
    const deadline = new Date(o.paymentDeadline);
    const diffMs = deadline.getTime() - new Date().getTime();

    const I = o.ID || o.title;
    const amount = o.amount;
    const penalty = amount*0.1;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const hoursLeft = diffMs / (1000 * 60 * 60);

    const is = (new Date(o.penalty.changedOn)  - new Date())
    const is24 = Math.floor(is / (1000 * 60 * 60 * 24));
    
    if(!o.penalty || is24 ){
      o.penalty.p = penalty;
      o.penalty.changedOn = new Date();
      o.amount = Math.floor(amount + penalty);
    }

    return;
  }
}

export const formatDate = (rawDate) => {
  return new Date(rawDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

export const generateCustomID = (
  baseId,
  typeCode,
  sequence = null
) => {
  const cleanBase = String(baseId).toUpperCase().replace(/\s+/g, "");

  const code = typeCode.toUpperCase();

  const suffix = sequence !== null
    ? String(sequence).padStart(4, "0")
    : Date.now().toString().slice(-6); // collision-resistant

  return `${cleanBase}-${code}-${suffix}`;
};
