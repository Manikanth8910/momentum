import assert from "assert";

const BASE_URL = "http://localhost:5050";

async function runTests() {
  console.log("🧪 Starting API Integration Tests...");
  let token = null;
  let testTaskId = null;

  try {
    // 1. Test Health Check
    console.log("\n1. Testing GET /health...");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthData.success, true);
    console.log("✅ Health Check passed:", healthData.data.database);

    // 2. Test User Login
    console.log("\n2. Testing POST /api/v1/auth/login...");
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex.thorne@momentum.com",
        password: "Password123",
      }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginData.success, true);
    assert.ok(loginData.data.token);
    token = loginData.data.token;
    console.log("✅ Login passed. Token acquired.");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 3. Test Get Profile (/me)
    console.log("\n3. Testing GET /api/v1/auth/me...");
    const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers });
    const meData = await meRes.json();
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meData.data.email, "alex.thorne@momentum.com");
    console.log("✅ Get Profile passed. User name:", meData.data.name);

    // 4. Test Get Tasks
    console.log("\n4. Testing GET /api/v1/tasks...");
    const tasksRes = await fetch(`${BASE_URL}/api/v1/tasks`, { headers });
    const tasksData = await tasksRes.json();
    assert.strictEqual(tasksRes.status, 200);
    assert.ok(tasksData.data.tasks.length >= 5); // Seeded tasks
    console.log(`✅ Get Tasks passed. Found ${tasksData.data.tasks.length} tasks.`);

    // 5. Test Create Task
    console.log("\n5. Testing POST /api/v1/tasks...");
    const createTaskRes = await fetch(`${BASE_URL}/api/v1/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Verify OAuth Sync",
        description: "Verify that Google OAuth creates users successfully.",
        priority: "High",
        status: "Todo",
        category: "Security",
        labels: ["OAuth", "Testing"],
        dueDate: new Date().toISOString(),
        position: 6,
      }),
    });
    const createTaskData = await createTaskRes.json();
    assert.strictEqual(createTaskRes.status, 201);
    assert.strictEqual(createTaskData.data.title, "Verify OAuth Sync");
    testTaskId = createTaskData.data._id;
    console.log("✅ Create Task passed. New Task ID:", testTaskId);

    // 6. Test Task Reordering
    console.log("\n6. Testing PATCH /api/v1/tasks/reorder...");
    const reorderRes = await fetch(`${BASE_URL}/api/v1/tasks/reorder`, {
      method: "PATCH",
      headers,
      body: JSON.stringify([
        { id: testTaskId, position: 10 },
      ]),
    });
    const reorderData = await reorderRes.json();
    assert.strictEqual(reorderRes.status, 200);
    assert.strictEqual(reorderData.success, true);
    console.log("✅ Task Reordering passed.");

    // 7. Test Dashboard Aggregation
    console.log("\n7. Testing GET /api/v1/dashboard...");
    const dashRes = await fetch(`${BASE_URL}/api/v1/dashboard`, { headers });
    const dashData = await dashRes.json();
    assert.strictEqual(dashRes.status, 200);
    assert.ok(dashData.data.summary);
    assert.ok(dashData.data.priorityDistribution);
    assert.ok(dashData.data.statusDistribution);
    console.log("✅ Dashboard Aggregations passed. Total tasks:", dashData.data.summary.totalTasks);

    // 8. Test Activity Logs
    console.log("\n8. Testing GET /api/v1/activity...");
    const actRes = await fetch(`${BASE_URL}/api/v1/activity`, { headers });
    const actData = await actRes.json();
    assert.strictEqual(actRes.status, 200);
    assert.ok(actData.data.length > 0);
    console.log(`✅ Activity Logs passed. Found ${actData.data.length} logs.`);

    // 9. Test Global Search
    console.log("\n9. Testing GET /api/v1/search?q=Authentication...");
    const searchRes = await fetch(`${BASE_URL}/api/v1/search?q=Authentication`, { headers });
    const searchData = await searchRes.json();
    assert.strictEqual(searchRes.status, 200);
    assert.ok(searchData.data.length > 0);
    console.log(`✅ Global Search passed. Found ${searchData.data.length} matching tasks.`);

    // 10. Test Soft Delete
    console.log("\n10. Testing DELETE /api/v1/tasks/:id...");
    const deleteRes = await fetch(`${BASE_URL}/api/v1/tasks/${testTaskId}`, {
      method: "DELETE",
      headers,
    });
    const deleteData = await deleteRes.json();
    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteData.success, true);
    console.log("✅ Soft Delete passed.");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The backend is fully functional.");
  } catch (error) {
    console.error("\n❌ Test Suite Failed:", error.message);
    process.exit(1);
  }
}

runTests();
