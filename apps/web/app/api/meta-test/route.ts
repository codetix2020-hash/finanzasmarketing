import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
	const token =
		"IGAAQxcaG1DaxBZAGIwNFFMVTJTS1psYWdERGlIVFpjOXFOS0REY1FHMTlvc0QxRUFUa043U2VNM2hETDRndjFuZAU9abEx0TnBROU1uUFc2al80Nl9scXVUTXhHcVNWRDRTa1FGR0phUUJyTllWc0J0dzIyTE8yUFUwUGQ0OWNfQQZDZD";
	const igUserId = "25674596542200641";
	const results: any = {};

	// Test 1: instagram_business_basic
	const basicRes = await fetch(
		`https://graph.instagram.com/v21.0/me?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${token}`,
	);
	results.basic = await basicRes.json();

	// Test 2: instagram_business_content_publish
	const containerRes = await fetch(
		`https://graph.instagram.com/v21.0/${igUserId}/media`,
		{
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				image_url:
					"https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
				caption: "PilotSocials Meta App Review Test",
				access_token: token,
			}),
		},
	);
	results.container = await containerRes.json();

	if (results.container.id) {
		await new Promise((r) => setTimeout(r, 5000));
		const publishRes = await fetch(
			`https://graph.instagram.com/v21.0/${igUserId}/media_publish`,
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					creation_id: results.container.id,
					access_token: token,
				}),
			},
		);
		results.publish = await publishRes.json();

		// Test 3: instagram_business_manage_comments
		if (results.publish.id) {
			await new Promise((r) => setTimeout(r, 10000));
			const commentRes = await fetch(
				`https://graph.instagram.com/v21.0/${results.publish.id}/comments`,
				{
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({
						message: "PilotSocials automated comment test",
						access_token: token,
					}),
				},
			);
			results.comment = await commentRes.json();
		}
	}

	return NextResponse.json(results);
}
