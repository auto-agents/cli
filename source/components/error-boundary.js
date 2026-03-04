import React from 'react';
import { render, Text } from 'ink';
import fs from 'fs';
import path from 'path';

class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            isCrashed: false
        };

    }

    static getDerivedStateFromError(error) {
        //console.log(error.message)
        fs.appendFileSync(path.join(process.cwd(), 'errors.log'), 'zizi fesse')
        //process.exit(1)
        return {
            isCrashed: true
        };
    }

    render() {
        /*if (this.state.isCrashed) {
            //process.exit(1)
            return <Text color="red">Oh no, app crashed</Text>;
        }*/

        return this.props.children;
    }

    componentDidCatch(error, errorInfo) {
        // Errored while rendering components
        //console.log(error.message)
        fs.appendFileSync(path.join(process.cwd(), 'errors.log'), 'zizi fesse')
        //process.exit(1)
    }
    /*
        componentDidMount() {
            process.setUncaughtExceptionCaptureCallback(this.crashed)
        }
    
        componentWillUnmount() {
            process.setUncaughtExceptionCaptureCallback(null)
        }
    */
}

export default ErrorBoundary
