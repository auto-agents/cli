import React from 'react';
import { Text, Box } from 'ink';
import Spinner from "./spinner.js";

export default function Loading({ action = 'Loading', subject = '' }) {
	return (
		<Box marginTop={1}>
			<Text>
				<Text>{action}</Text> <Text color="green">{subject} ... </Text>
			</Text>
			<Spinner />
		</Box>
	);
}
