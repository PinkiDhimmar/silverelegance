document.addEventListener('DOMContentLoaded', () => {
  fetch('/admin/dashboard-data')
    .then(res => res.json())
    .then(data => {
      // Inject stats
      document.getElementById('total-orders').innerText = data.stats.total_orders;
      document.getElementById('total-customers').innerText = data.stats.total_customers;
      document.getElementById('total-revenue').innerText = `$${parseFloat(data.stats.total_revenue).toFixed(2)}`;
      document.getElementById('total-products').innerText = data.stats.total_products;

      // Populate recent orders
      const ordersTable = document.getElementById('recent-orders');
      if (ordersTable && data.recentOrders) {
        ordersTable.innerHTML = '';
        data.recentOrders.forEach(order => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.name}</td>
            <td>${order.status}</td>
            <td>$${parseFloat(order.grand_total).toFixed(2)}</td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
          `;
          ordersTable.appendChild(row);
        });
      }
    })
    .catch(err => {
      console.error('Failed to fetch dashboard data:', err);
    });
});
