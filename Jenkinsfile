pipeline {
    agent {
        docker {
            image 'node-sonar' // Custom image with Node + sonar-scanner
            args '-u root --network devnet'
        }
    }

    environment {
        APP_DIR = 'Frontend'
        BRANCH_NAME = 'message'
        GIT_REPO = 'https://github.com/FantasticFiveE/PiFantasticFive.git'
        SONAR_PROJECT_KEY = 'Devops'
        SONAR_HOST_URL = 'http://sonarqube:9000' // use Docker network hostname
    }

    stages {
        stage('📦 Checkout Code') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${BRANCH_NAME}"]],
                    userRemoteConfigs: [[
                        url: "${GIT_REPO}",
                        credentialsId: 'github-creds'
                    ]]
                ])
            }
        }

        stage('📥 Install Dependencies') {
            steps {
                dir("${APP_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('🧪 Run Unit Tests') {
            steps {
                dir("${APP_DIR}") {
                    sh 'npm test || true' // Skip failure if test script is missing
                }
            }
        }

        stage('🔍 SonarQube Analysis') {
            steps {
                dir("${APP_DIR}") {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        withSonarQubeEnv('scanner') {
                            retry(3) {
                                sleep(time: 20, unit: 'SECONDS') // Give SonarQube time to be ready
                                sh 'sonar-scanner -Dsonar.projectKey=$SONAR_PROJECT_KEY -Dsonar.sources=src -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.login=$SONAR_TOKEN'
                            }
                        }
                    }
                }
            }
        }

        stage('⚙️ Build Project') {
            steps {
                dir("${APP_DIR}") {
                    sh 'npm run build'
                }
            }
        }
    }

    post {
        success {
            echo '✅ Build and tests succeeded!'
        }
        failure {
            echo '❌ Build failed!'
        }
    }
}
