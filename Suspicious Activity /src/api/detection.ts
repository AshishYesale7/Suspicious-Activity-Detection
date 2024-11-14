export async function detectActivity() {
  // TODO: Implement actual API call to backend
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        timestamp: new Date().toISOString(),
        activity: 'normal',
        confidence: 0.95
      });
    }, 1000);
  });
}