import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from functools import lru_cache
from utils.logger import get_logger

logger = get_logger(__name__)

@lru_cache(maxsize=1)
def get_dynamodb_resource():
    """Cached DynamoDB resource — created once, reused."""
    import os
    from dotenv import load_dotenv
    load_dotenv()

    return boto3.resource(
        "dynamodb",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )

def get_table(table_name: str):
    db = get_dynamodb_resource()
    return db.Table(table_name)


class DynamoDBClient:
    """
    Generic DynamoDB helper used by all services.
    Wraps put, get, query, scan, update, delete with consistent error handling.
    """

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.table = get_table(table_name)

    def put_item(self, item: dict) -> bool:
        try:
            self.table.put_item(Item=item)
            logger.info(f"[{self.table_name}] put_item success")
            return True
        except ClientError as e:
            logger.error(f"[{self.table_name}] put_item error: {e}")
            return False

    def get_item(self, key: dict) -> dict | None:
        try:
            resp = self.table.get_item(Key=key)
            return resp.get("Item")
        except ClientError as e:
            logger.error(f"[{self.table_name}] get_item error: {e}")
            return None

    def scan_items(
        self,
        filter_expression=None,
        limit: int = 100,
        last_key: dict = None
    ) -> dict:
        try:
            kwargs = {"Limit": limit}
            if filter_expression is not None:
                kwargs["FilterExpression"] = filter_expression
            if last_key:
                kwargs["ExclusiveStartKey"] = last_key

            resp = self.table.scan(**kwargs)
            return {
                "items": resp.get("Items", []),
                "last_key": resp.get("LastEvaluatedKey")
            }
        except ClientError as e:
            logger.error(f"[{self.table_name}] scan error: {e}")
            return {"items": [], "last_key": None}

    def query_items(
        self,
        index_name: str,
        key_condition,
        filter_expression=None,
        limit: int = 100,
        scan_index_forward: bool = False
    ) -> list:
        try:
            kwargs = {
                "IndexName": index_name,
                "KeyConditionExpression": key_condition,
                "ScanIndexForward": scan_index_forward,
                "Limit": limit
            }
            if filter_expression is not None:
                kwargs["FilterExpression"] = filter_expression
            resp = self.table.query(**kwargs)
            return resp.get("Items", [])
        except ClientError as e:
            logger.error(f"[{self.table_name}] query error: {e}")
            return []

    def update_item(self, key: dict, update_expr: str, expr_values: dict, expr_names: dict = None) -> bool:
        try:
            kwargs = {
                "Key": key,
                "UpdateExpression": update_expr,
                "ExpressionAttributeValues": expr_values,
                "ReturnValues": "UPDATED_NEW"
            }
            if expr_names:
                kwargs["ExpressionAttributeNames"] = expr_names
            self.table.update_item(**kwargs)
            return True
        except ClientError as e:
            logger.error(f"[{self.table_name}] update_item error: {e}")
            return False

    def delete_item(self, key: dict) -> bool:
        try:
            self.table.delete_item(Key=key)
            return True
        except ClientError as e:
            logger.error(f"[{self.table_name}] delete_item error: {e}")
            return False