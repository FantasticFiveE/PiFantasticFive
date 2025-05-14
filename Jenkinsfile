pipeline {
    agent any

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
                git branch: "${BRANCH_NAME}",
                    credentialsId: 'github-creds',
                    url: "${GIT_REPO}"
            }
        }

        stage('📥 Install Dependencies') {
            agent {
                docker {
                    image 'node-sonar'
                    args "--network devnet -u root -v ${env.WORKSPACE}/..:/workspace"
                }
            }
            steps {
                dir("/workspace/${APP_DIR}") {
                    sh 'ls -la'
                    sh 'npm install'
                }
            }
        }

        stage('🧪 Run Unit Tests') {
            agent {
                docker {
                    image 'node-sonar'
                    args "--network devnet -u root -v ${env.WORKSPACE}/..:/workspace"
                }
            }
            steps {
                dir("/workspace/${APP_DIR}") {
                    script {
                        def pkg = readJSON file: 'package.json'
                        if (pkg.scripts?.test) {
                            sh 'npm test'
                        } else {
                            echo '⚠️ No test script found in package.json'
                        }
                    }
                }
            }
        }

        stage('🔍 SonarQube Analysis') {
            agent {
                docker {
                    image 'node-sonar'
                    args "--network devnet -u root -v ${env.WORKSPACE}/..:/workspace"
                }
            }
            steps {
                dir("/workspace/${APP_DIR}") {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        withSonarQubeEnv('scanner') {
                            retry(3) {
                                sleep(time: 20, unit: 'SECONDS')
                                sh """
                                    sonar-scanner \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                        -Dsonar.sources=src \
                                        -Dsonar.host.url=${SONAR_HOST_URL} \
                                        -Dsonar.login=${SONAR_TOKEN}
                                """
                            }
                        }
                    }
                }
            }
        }

        stage('⚙️ Build Project') {
            agent {
                docker {
                    image 'node-sonar'
                    args "--network devnet -u root -v ${env.WORKSPACE}/..:/workspace"
                }
            }
            steps {
                dir("/workspace/${APP_DIR}") {
                    sh 'npm run build'
                }
            }
        }
    }

    post {
        success {
            echo '✅ Build and analysis successful!'
        }
        failure {
            echo '❌ Build or analysis failed!'
        }
    }
}
