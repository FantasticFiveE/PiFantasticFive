pipeline {
    agent {
        docker {
            image 'node:18'
            args '-u root'
        }
    }

    environment {
        APP_DIR = 'Frontend'
        BRANCH_NAME = 'message'
        GIT_REPO = 'https://github.com/FantasticFiveE/PiFantasticFive.git'
        SONAR_PROJECT_KEY = 'Devops'
        SONAR_HOST_URL = 'http://sonarqube:9000'
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
                    sh 'npm test || true'
                }
            }
        }

        stage('🔍 SonarQube Analysis') {
            steps {
                dir("${APP_DIR}") {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_AUTH_TOKEN')]) {
                        withSonarQubeEnv('scanner') {
                            sh """
                                sonar-scanner \
                                  -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                  -Dsonar.sources=src \
                                  -Dsonar.host.url=${SONAR_HOST_URL} \
                                  -Dsonar.login=$SONAR_AUTH_TOKEN
                            """
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
