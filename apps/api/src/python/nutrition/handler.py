"""
AWS Lambda handler for nutrition label generation services.
Consolidated from nutrition-label-generator and nutrition-label-service.
"""

import json
import base64
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Lazy imports to reduce cold start time
bedrock_client = None
visual_creator = None
label_generator = None
crisis_generator = None


def initialize_clients():
    """Initialize AWS Bedrock and label generation clients."""
    global bedrock_client, visual_creator, label_generator, crisis_generator

    if bedrock_client is None:
        from aws_bedrock_client import BedrockClient
        from visual_label_creator import NutritionLabelCreator
        from label_generator import NutritionLabelGenerator
        from crisis_response import CrisisResponseGenerator

        bedrock_client = BedrockClient(
            region=os.environ.get("BEDROCK_REGION", "us-east-1"),
            model_id=os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")
        )
        visual_creator = NutritionLabelCreator()
        label_generator = NutritionLabelGenerator(bedrock_client, visual_creator)
        crisis_generator = CrisisResponseGenerator(bedrock_client, visual_creator)

        logger.info("All clients initialized successfully")


def create_response(status_code: int, body: Any, headers: Optional[Dict] = None) -> Dict:
    """Create standardized Lambda response."""
    default_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }

    if headers:
        default_headers.update(headers)

    return {
        'statusCode': status_code,
        'headers': default_headers,
        'body': json.dumps(body) if not isinstance(body, str) else body
    }


def generate_label_handler(event: Dict, context: Any) -> Dict:
    """
    Lambda handler for nutrition label generation.
    Path: POST /nutrition/generate
    """
    try:
        initialize_clients()

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        if not body:
            return create_response(400, {'error': 'Request body is required'})

        # Extract product data
        product_data = body.get('productData', {})
        target_markets = body.get('targetMarkets', ['US'])
        include_visual = body.get('includeVisual', True)

        logger.info(f"Generating labels for markets: {target_markets}")

        # Generate labels for each market
        results = {}
        for market in target_markets:
            try:
                # Generate label content
                label_result = label_generator.generate_label(
                    product_data=product_data,
                    market=market
                )

                # Generate visual if requested
                if include_visual:
                    visual_result = visual_creator.create_label(
                        label_data=label_result['content'],
                        market=market
                    )
                    label_result['visual'] = {
                        'format': 'base64',
                        'mimeType': 'image/png',
                        'data': visual_result.get('image_base64')
                    }

                results[market] = label_result

            except Exception as market_error:
                logger.error(f"Error generating label for {market}: {str(market_error)}")
                results[market] = {
                    'error': str(market_error),
                    'status': 'failed'
                }

        return create_response(200, {
            'success': True,
            'labels': results,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in generate_label_handler: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })


def crisis_response_handler(event: Dict, context: Any) -> Dict:
    """
    Lambda handler for crisis response analysis.
    Path: POST /nutrition/crisis-response
    """
    try:
        initialize_clients()

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        if not body:
            return create_response(400, {'error': 'Request body is required'})

        # Extract crisis data
        crisis_type = body.get('crisisType', 'contamination')
        severity = body.get('severity', 'medium')
        product_data = body.get('productData', {})
        affected_markets = body.get('affectedMarkets', ['US'])

        logger.info(f"Generating crisis response for: {crisis_type} - Severity: {severity}")

        # Generate crisis response
        response = crisis_generator.generate_response(
            crisis_type=crisis_type,
            severity=severity,
            product_data=product_data,
            affected_markets=affected_markets
        )

        # Store in DynamoDB if table is configured
        if os.environ.get('CRISIS_LOGS_TABLE'):
            import boto3
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(os.environ['CRISIS_LOGS_TABLE'])

            table.put_item(Item={
                'crisisId': response.get('crisisId'),
                'timestamp': datetime.now().isoformat(),
                'crisisType': crisis_type,
                'severity': severity,
                'response': response
            })

        return create_response(200, {
            'success': True,
            'crisisResponse': response,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in crisis_response_handler: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })


def visual_label_handler(event: Dict, context: Any) -> Dict:
    """
    Lambda handler for generating visual nutrition labels only.
    Path: POST /nutrition/visual
    """
    try:
        initialize_clients()

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        if not body:
            return create_response(400, {'error': 'Request body is required'})

        label_data = body.get('labelData', {})
        market = body.get('market', 'US')
        format_type = body.get('format', 'standard')

        logger.info(f"Generating visual label for market: {market}")

        # Generate visual label
        visual_result = visual_creator.create_label(
            label_data=label_data,
            market=market,
            format_type=format_type
        )

        # Store in S3 if bucket is configured
        if os.environ.get('LABELS_BUCKET'):
            import boto3
            from uuid import uuid4

            s3 = boto3.client('s3')
            label_id = str(uuid4())

            # Decode base64 and upload to S3
            image_data = base64.b64decode(visual_result['image_base64'])
            s3.put_object(
                Bucket=os.environ['LABELS_BUCKET'],
                Key=f"labels/{market}/{label_id}.png",
                Body=image_data,
                ContentType='image/png'
            )

            visual_result['s3_url'] = f"s3://{os.environ['LABELS_BUCKET']}/labels/{market}/{label_id}.png"

        return create_response(200, {
            'success': True,
            'visual': visual_result,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in visual_label_handler: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })


def health_check_handler(event: Dict, context: Any) -> Dict:
    """
    Lambda handler for health check.
    Path: GET /nutrition/health
    """
    return create_response(200, {
        'status': 'healthy',
        'service': 'nutrition-label-service',
        'timestamp': datetime.now().isoformat(),
        'region': os.environ.get('AWS_REGION', 'unknown'),
        'runtime': 'python3.11'
    })